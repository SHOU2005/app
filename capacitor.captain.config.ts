import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId:   'com.switchnow.captainapp',
  appName: 'Switch Captain',
  webDir:  'out',
  android: {
    backgroundColor: '#FFFFFF',
  },
  server: {
    url:       'http://192.168.1.108:3000',
    cleartext: true,
  },
}

export default config
