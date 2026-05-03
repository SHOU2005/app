import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId:   'com.switchnow.captainapp',
  appName: 'Switch Captain',
  webDir:  'out',
  android: {
    path:            'android-captain',
    backgroundColor: '#FFFFFF',
  },
  server: {
    url:       'https://app.switchlocally.com/captain/splash',
    cleartext: false,
  },
}

export default config
