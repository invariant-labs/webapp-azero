import fs from 'fs'
import axios from 'axios'

const run = async () => {
  const tokensObject = (await axios.get('https://api.psplist.xyz/tokens')).data

  const tokensList = {}
  tokensObject.forEach(({ symbol, contractAddress, decimals, name, logoURI, description }) => {
    tokensList[contractAddress] = {
      symbol,
      address: contractAddress,
      decimals,
      name,
      logoURI: `https://api.psplist.xyz/tokens/${contractAddress}/logo`
    }
  })

  fs.writeFileSync('./src/store/consts/tokenLists/mainnet.json', JSON.stringify(tokensList))
  console.log('Tokens list updated!')
}

run()
