import { ConfigContext, ExpoConfig } from 'expo/config';

const IS_DEV = process.env.APP_VARIANT === 'development';

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    slug: config.slug!,
    name: IS_DEV ? 'Scheduler (Dev)' : 'Scheduler',
    scheme: IS_DEV ? 'teacherschedule-dev' : config.scheme,
    android: {
        ...config.android,
        package: IS_DEV ? 'com.dmitriy.teacherschedule.dev' : 'com.dmitriy.teacherscheduler',
    },
});
