import { createContext } from 'react'

const SettingsContext = createContext({ settings: null, updateSettings: () => {} })

export default SettingsContext
