import { Plugin } from '@opencode/plugin';
import { appendFileSync, existsSync, realpathSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';

/**
 * .opencode/plugins/security.ts — OpenCode V2 (2.x)
 *
 * 1. Запрет чтения и изменения .env (файловые инструменты, grep, shell)
 * 2. Запрет опасных shell-команд (POSIX, Git Bash и PowerShell/cmd)
 * 3. Запрет изменения .opencode/ (чтение разрешено)
 *
 * V2: плагин — это default export `Plugin.define({ id, setup })`.
 * Хуки регистрируются в setup через ctx.<domain>.hook(...), а не
 * возвращаются объектом, как в V1. V1-плагин в V2 не загружается.
 */

const PROTECTED_DIR = '.opencode';

// .env.example и подобные — не секреты, их разрешаем
const ENV_ALLOWED = /\.(example|sample|template|dist|defaults?)$/i;

// Для путей: .env, .env.local, .envrc, prod.env ...
const ENV_FILE = /^(\.env[^/\\]*|[^/\\]+\.env)$/i;
// Для токенов shell чуть строже, чтобы не ловить `process.env` в аргументах
const ENV_BASH = /^\.env[^/\\]*$/i;

// ─────────────────────── Журнал решений ───────────────────────

// DENY и LOAD пишутся всегда, ALLOW — только в debug-режиме.
const LOG_FILE = join(tmpdir(), 'opencode-security.log');
const DEBUG_FLAG = join(tmpdir(), 'opencode-security.debug');

function debugEnabled(): boolean {
    return process.env.SECURITY_DEBUG === '1' || existsSync(DEBUG_FLAG);
}

function audit(
    verdict: 'LOAD' | 'DENY' | 'ALLOW',
    tool: string,
    reason: string,
    detail: string,
): void {
    if (verdict === 'ALLOW' && !debugEnabled()) return;
    const line = [
        new Date().toISOString(),
        verdict,
        tool,
        reason,
        detail.replace(/\r?\n/g, '\\n').slice(0, 300),
    ].join(' | ');
    try {
        appendFileSync(LOG_FILE, line + '\n', 'utf8');
    } catch {
        /* журнал не должен ломать проверку */
    }
}

// Инструменты, которые изменяют файлы
const WRITE_TOOLS = new Set(['write', 'edit', 'multiedit', 'patch', 'apply_patch']);

// Аргументы инструментов, в которых лежат пути
const PATH_KEYS = ['filePath', 'filepath', 'file_path', 'path', 'file', 'include', 'paths', 'files'];

// Чтение, которое ничего не меняет (нужно для проверки .opencode/)
const READONLY_CMDS = new Set([
    // POSIX
    'ls',
    'cat',
    'head',
    'tail',
    'less',
    'more',
    'wc',
    'file',
    'stat',
    'tree',
    'grep',
    'egrep',
    'fgrep',
    'rg',
    'diff',
    'du',
    'pwd',
    'echo',
    // PowerShell
    'get-content',
    'get-item',
    'get-childitem',
    'get-location',
    'select-string',
    'resolve-path',
    'test-path',
    'measure-object',
    'format-list',
    'format-table',
    'out-string',
    'sort-object',
    'where-object',
    // Алиасы PowerShell/cmd
    'type',
    'dir',
    'gc',
    'gci',
    'gl',
    'sls',
    'select',
    'where',
    'fl',
    'ft',
    'write-output',
]);

const READONLY_GIT = new Set(['status', 'diff', 'log', 'show', 'ls-files', 'blame', 'branch']);

// ─────────────────────── Опасные команды ───────────────────────

const DANGEROUS: Array<[string, RegExp]> = [
    ['privilege escalation (sudo/su/doas)', /(^|[\s;&|(])(sudo|su|doas)(\s|$)/],
    ['pipe into a shell', /\|\s*(sudo\s+)?(ba|z|da|k|c)?sh\b/],
    [
        'download piped into an interpreter',
        /\b(curl|wget)\b[^\n|]*\|\s*(sudo\s+)?(python[\d.]*|perl|ruby|node|php)\b/,
    ],
    [
        'executing downloaded code',
        /(\beval\b|\b(ba|z|da)?sh\b|\bsource\b)[^\n]*(\$\(|<\(|`)\s*(curl|wget)\b/,
    ],
    [
        'download piped into PowerShell',
        /\b(iwr|irm|invoke-webrequest|invoke-restmethod)\b[^\n|]*\|\s*(iex|invoke-expression)\b/i,
    ],
    [
        'encoded PowerShell command',
        /\b(powershell|pwsh)(\.exe)?\b[^\n]*\s-(e|ec|enc|encodedcommand)\b/i,
    ],
    [
        'disk format / wipe',
        /\b(mkfs(\.\w+)?|wipefs|shred|fdisk|parted|sgdisk)\b|\bdd\b[^\n]*\bof=\/dev\//,
    ],
    [
        'disk format / wipe (Windows)',
        /\b(format-volume|clear-disk|initialize-disk|remove-partition|diskpart)\b/i,
    ],
    [
        'write to block device or system directory',
        />\s*\/dev\/(sd|nvme|hd|disk)|(>|\btee\b(\s+-a)?)\s*\/(etc|boot|usr|bin|sbin|lib|sys|proc)\//,
    ],
    ['fork bomb', /:\s*\(\s*\)\s*\{/],
    [
        'shutdown / reboot',
        /(^|[\s;&|(])(shutdown|reboot|halt|poweroff)(\s|$)|\binit\s+[06]\b|\bsystemctl\s+(poweroff|reboot|halt)\b/,
    ],
    ['shutdown / reboot (Windows)', /\b(stop-computer|restart-computer)\b/i],
    ['kill all processes', /\bkill\s+(-\S+\s+)*-1(\s|$)|\bkillall5\b/],
    ['chmod 777', /\bchmod\b[^\n]*\b0?777\b/],
    [
        'recursive chmod/chown on / or ~',
        /\bch(mod|own)\b[^\n]*(-R|--recursive)[^\n]*\s(\/|~|\$HOME)(\s|$)/,
    ],
    [
        'find -delete / -exec rm from / or ~',
        /\bfind\s+(\/|~|\$HOME)(\s|$)[^\n]*(-delete|-exec\s+rm)/,
    ],
    [
        'git force push',
        /\bgit\b[^\n]*\bpush\b[^\n]*(--force\b|--force-with-lease|\s-[a-zA-Z]*f[a-zA-Z]*(\s|$)|\s\+\S)/,
    ],
    ['git reset --hard', /\bgit\b[^\n]*\breset\b[^\n]*--hard\b/],
    ['git clean -f', /\bgit\b[^\n]*\bclean\b[^\n]*\s-[a-zA-Z]*f/],
    ['git discard all changes', /\bgit\s+(checkout|restore)\s+(--\s+)?\.(\s|$)/],
    [
        'uploading local files over HTTP',
        /\b(curl|wget)\b[^\n]*(\s-d\s*['"]?@|--data(-binary|-raw|-urlencode)?[\s=]+['"]?@|\s-F\s*['"]?[^\s'"]*=@|--form[\s=]+\S*@|\s-T\s|--upload-file|--post-file)/,
    ],
    [
        'reverse shell / raw sockets',
        /\/dev\/(tcp|udp)\/|\b(nc|ncat|netcat)\b[^\n]*\s-[a-zA-Z]*e\b|\bsocat\b[^\n]*\bexec:/i,
    ],
    [
        'publishing packages',
        /\b(npm|pnpm|yarn|bun)\s+publish\b|\btwine\s+upload\b|\bcargo\s+publish\b/,
    ],
    [
        'docker privileged / host mount',
        /\bdocker\b[^\n]*(--privileged|\s-v\s*\/:|--pid=host|--net(work)?=host)/,
    ],
];

// Рекурсивное удаление анализируем по токенам, а не регуляркой
const DELETE_CMDS = new Set([
    'rm',
    'remove-item',
    'ri',
    'del',
    'erase',
    'rd',
    'rmdir',
    'remove-item.exe',
]);

const BAD_TARGET =
    /^(\/|\/\*|~|~\/|~\/\*|\$HOME|\$\{HOME\}|\$HOME\/\*|\*|\.|\.\/|\.\/\*|\.\.|\.\.\/|\.\.\/\*|\.\*|\$env:userprofile|\$env:userprofile[\\/]\*?|%userprofile%|[a-z]:|[a-z]:[\\/]\*?|[\\/]\*?)$/i;

function dangerousDelete(segment: string, wholeCommand: string): boolean {
    const toks = segment
        .trim()
        .split(/\s+/)
        .map((t) => t.replace(/^['"]|['"]$/g, ''));
    const i = toks.findIndex((t) => DELETE_CMDS.has(basename(t).toLowerCase()));
    if (i < 0) return false;

    const args = toks.slice(i + 1);
    if (args.some((a) => a.toLowerCase() === '--no-preserve-root')) return true;

    const recursive = args.some(
        (a) =>
            /^-[a-z]*r[a-z]*$/i.test(a) ||
            /^-(recurse|r)$/i.test(a) ||
            /^\/s$/i.test(a) ||
            /--recursive/i.test(a),
    );
    if (!recursive) return false;

    const targets = args.filter(
        (a) => !a.startsWith('-') && !/^\/[sqfy]$/i.test(a) && a.toLowerCase() !== '--recurse',
    );
    // `Get-ChildItem / | Remove-Item -Recurse -Force` — цель приходит по конвейеру
    if (!targets.length) return /\|/.test(wholeCommand);

    return targets.some((t) => BAD_TARGET.test(t) || /^\/[^/]*\/?$/.test(t));
}

// ───────────────────────── Хелперы ─────────────────────────

function isEnvPath(p: string): boolean {
    const name = p.split(/[\\/]/).filter(Boolean).pop() ?? '';
    return ENV_FILE.test(name) && !ENV_ALLOWED.test(name);
}

function inProtectedDir(p: string): boolean {
    return p.split(/[\\/]/).includes(PROTECTED_DIR);
}

function resolveAbs(base: string, p: string): string {
    const home = process.env.HOME ?? process.env.USERPROFILE ?? homedir();
    return resolve(base, p.startsWith('~/') ? home + p.slice(1) : p);
}

function realOrSelf(p: string): string {
    try {
        return realpathSync(p); // раскрывает симлинки (ln -s .env foo)
    } catch {
        return p; // файла ещё нет — это нормально
    }
}

function pathsFromPatch(text: string): string[] {
    const out: string[] = [];
    for (const m of text.matchAll(/^\*\*\*\s+(?:Add|Update|Delete)\s+File:\s*(.+)$/gm))
        out.push(m[1].trim());
    for (const m of text.matchAll(/^\*\*\*\s+Move to:\s*(.+)$/gm)) out.push(m[1].trim());
    for (const m of text.matchAll(/^(?:\+\+\+|---)\s+(?:[ab]\/)?(\S+)/gm)) out.push(m[1]);
    return out;
}

function collectPaths(input: Record<string, unknown>): string[] {
    const out: string[] = [];
    for (const k of PATH_KEYS) {
        const v = input[k];
        if (typeof v === 'string') out.push(v);
        else if (Array.isArray(v)) for (const x of v) if (typeof x === 'string') out.push(x);
    }
    for (const k of ['patchText', 'patch', 'diff']) {
        const v = input[k];
        if (typeof v === 'string') out.push(...pathsFromPatch(v));
    }
    return out;
}

function splitSegments(command: string): string[] {
    return command
        .split(/&&|\|\||;|\n|\|/)
        .map((s) => s.trim())
        .filter(Boolean);
}

function shellTouchesEnv(command: string): string | null {
    for (const tok of command.split(/[\s=<>()`;|&'"{},:$]+/)) {
        const name = tok.split(/[\\/]/).filter(Boolean).pop() ?? '';
        if (ENV_BASH.test(name) && !ENV_ALLOWED.test(name)) return tok;
    }
    return null;
}

function isReadOnlySegment(seg: string): boolean {
    const toks = seg.split(/\s+/).filter((t) => t && !/^[A-Za-z_]\w*=/.test(t)); // пропускаем VAR=val
    if (!toks.length) return true;
    const cmd = basename(toks[0]).toLowerCase();
    if (cmd === 'git' || cmd === 'git.exe') return READONLY_GIT.has((toks[1] ?? '').toLowerCase());
    if (cmd === 'find') return !/\s-(delete|exec|execdir|ok|okdir|fprint\S*|fls)\b/.test(seg);
    return READONLY_CMDS.has(cmd);
}

function shellModifiesProtected(command: string, cwd: string | undefined, base: string): boolean {
    const cwdInside = cwd ? inProtectedDir(resolveAbs(base, cwd)) : false;
    if (!command.includes(PROTECTED_DIR) && !cwdInside) return false;

    // убираем безвредные редиректы вида 2>&1 и >/dev/null
    const cleaned = command.replace(/\d*>&\d+/g, '').replace(/\d*>\s*\/dev\/null/g, '');
    // перенаправление вывода или подстановки — проанализировать нельзя, блокируем
    if (/[>`]|\$\(|<\(/.test(cleaned)) return true;
    // каждый сегмент команды обязан быть read-only
    return !splitSegments(cleaned).every(isReadOnlySegment);
}

// ───────────────────────── Плагин ─────────────────────────

export default Plugin.define({
    id: 'security',
    async setup(ctx) {
        const base = ctx.location.directory;

        audit('LOAD', 'plugin', 'loaded', `${base} | log=${LOG_FILE} | debug=${debugEnabled()}`);

        const deny = (tool: string, reason: string, detail: string): never => {
            audit('DENY', tool, reason, detail);
            console.warn(`[security] blocked: ${reason} — ${detail.slice(0, 300)}`);
            throw new Error(
                `Security policy: ${reason}. This action is blocked. Do not retry it or look for workarounds; ask the user instead.`,
            );
        };

        const assertPath = (raw: string, tool: string) => {
            const abs = resolveAbs(base, raw);
            const candidates = [raw, abs, realOrSelf(abs)];

            if (candidates.some(isEnvPath)) {
                deny(tool, `access to .env files is not allowed (${raw})`, raw);
            }
            if (WRITE_TOOLS.has(tool) && candidates.some(inProtectedDir)) {
                deny(tool, `modifying ${PROTECTED_DIR}/ is not allowed (${raw})`, raw);
            }

            audit('ALLOW', tool, 'path allowed', raw);
        };

        const assertCommand = (tool: string, command: string, cwd: string | undefined) => {
            if (!command) return;

            // 1. .env
            const envTok = shellTouchesEnv(command);
            if (envTok) deny(tool, `access to .env files is not allowed (${envTok})`, command);

            // 2. опасные команды
            for (const [name, re] of DANGEROUS) {
                if (re.test(command)) deny(tool, `dangerous command: ${name}`, command);
            }
            if (splitSegments(command).some((seg) => dangerousDelete(seg, command))) {
                deny(
                    tool,
                    'dangerous command: recursive delete on a root/home/wildcard target',
                    command,
                );
            }

            // 3. .opencode
            if (shellModifiesProtected(command, cwd, base)) {
                deny(tool, `modifying ${PROTECTED_DIR}/ is not allowed`, command);
            }

            audit('ALLOW', tool, 'command allowed', command);
        };

        // Файловые инструменты: read, write, edit, patch, grep, glob, ...
        await ctx.tool.hook('execute.before', (event) => {
            const tool = String(event.tool ?? '').toLowerCase();
            const input = (event.input ?? {}) as Record<string, unknown>;

            if (tool === 'shell' || tool === 'bash') {
                assertCommand(tool, String(input.command ?? ''), input.workdir as string | undefined);
                return;
            }

            const paths = collectPaths(input);
            if (!paths.length) {
                audit('ALLOW', tool, 'no path arguments', '');
                return;
            }
            for (const raw of paths) assertPath(raw, tool);
        });

        // Любая shell-команда, в том числе запущенная из Code Mode
        await ctx.shell.hook('create.before', (event) => {
            assertCommand('shell', event.command, event.cwd);
        });
    },
});
