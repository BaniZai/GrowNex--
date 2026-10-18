'use client'

import { AppShell } from './app-shell'
import { StoreProvider, useStore } from './store'
import { HomeScreen } from './screens/s01-home'
import { ImportScreen } from './screens/s02-import'
import { ListScreen } from './screens/s03-list'
import { DatasetsScreen } from './screens/s04-datasets'
import { GenerateScreen } from './screens/s05-generate'
import { StandardsScreen } from './screens/s06-standards'
import { DevFindScreen } from './screens/s07-dev-find'
import { DevConfirmScreen } from './screens/s08-dev-confirm'
import { PolicyScreen } from './screens/s09-policy'
import { SettingsScreen } from './screens/s10-settings'

function Current() {
  const { screen } = useStore()
  switch (screen) {
    case 1: return <HomeScreen />
    case 2: return <ImportScreen />
    case 3: return <ListScreen />
    case 4: return <DatasetsScreen />
    case 5: return <GenerateScreen />
    case 6: return <StandardsScreen />
    case 7: return <DevFindScreen />
    case 8: return <DevConfirmScreen />
    case 9: return <PolicyScreen />
    case 10: return <SettingsScreen />
  }
}

export function Prototype() {
  return (
    <StoreProvider>
      <AppShell>
        <Current />
      </AppShell>
    </StoreProvider>
  )
}
