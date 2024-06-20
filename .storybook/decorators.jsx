import React from 'react'
import { Provider } from 'react-redux'

// export const withMaterialStyles = storyFn => (
//   <StylesProvider injectFirst>{storyFn()}</StylesProvider>
// )

export const withStore = store => storyFn => <Provider store={store}>{storyFn()}</Provider>
