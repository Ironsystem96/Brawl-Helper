import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.brawlhelper.app',
  appName: 'Brawl Helper',
  webDir: 'www',
  bundledWebRuntime: false,
  android: {
    backgroundColor: '#10131a'
  }
};

export default config;
