import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId:   'com.switchlocally.employer',
  appName: 'Switch Employer',
  webDir:  'out',
  android: {
    path:            'android-employer',
    backgroundColor: '#000000',
  },
  server: {
    url:       'https://app.switchlocally.com/employer',
    cleartext: false,
  },
}

export default config
