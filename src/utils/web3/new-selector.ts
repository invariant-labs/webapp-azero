export const connect = async (providerName: string) => {
  await (window.injectedWeb3 as any)[providerName].enable()
}

export const getAccounts = async (providerName: string) => {
  return await (await (window.injectedWeb3 as any)[providerName].enable()).accounts.get()
}
