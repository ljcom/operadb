import { useState } from 'react'
import { ethers } from 'ethers'

export default function Login({ onConnected }) {
  const [method, setMethod] = useState(null)
  const [mnemonicInput, setMnemonicInput] = useState('')
  const [generatedWallet, setGeneratedWallet] = useState(null)

  const handleMetamask = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    const address = await signer.getAddress()
    const sig = await signer.signMessage("Login to OperaDB Studio")
    onConnected({ address, signature: sig })
  }

  const handleMnemonicLogin = () => {
    try {
      const wallet = ethers.Wallet.fromPhrase(mnemonicInput.trim())
      onConnected({ address: wallet.address, privateKey: wallet.privateKey, mnemonic: wallet.mnemonic })
    } catch {
      alert("Seed phrase tidak valid.")
    }
  }

  const generateWallet = () => {
    const wallet = ethers.Wallet.createRandom()
    setGeneratedWallet(wallet)
  }

  const downloadSeed = () => {
    const blob = new Blob([generatedWallet.mnemonic.phrase], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'seed.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <h2>Login OperaDB Studio</h2>

      <button onClick={() => setMethod('metamask')}>🔐 Login dengan MetaMask</button>
      <button onClick={() => setMethod('upload')}>📥 Upload Seed Phrase</button>
      <button onClick={() => setMethod('generate')}>🪙 Buat Wallet Baru</button>

      {method === 'metamask' && <button onClick={handleMetamask}>🔓 Connect MetaMask</button>}

      {method === 'upload' && (
        <div>
          <textarea rows="3" placeholder="masukkan 12/24 kata seed" onChange={(e) => setMnemonicInput(e.target.value)} />
          <button onClick={handleMnemonicLogin}>Login</button>
        </div>
      )}

      {method === 'generate' && (
        <div>
          {generatedWallet ? (
            <>
              <p><b>Seed Phrase:</b></p>
              <pre>{generatedWallet.mnemonic.phrase}</pre>
              <button onClick={downloadSeed}>⬇️ Download Seed</button>
              <button onClick={() => onConnected({
                address: generatedWallet.address,
                privateKey: generatedWallet.privateKey,
                mnemonic: generatedWallet.mnemonic
              })}>Login dengan Wallet Baru</button>
            </>
          ) : (
            <button onClick={generateWallet}>🎲 Generate Wallet</button>
          )}
        </div>
      )}
    </div>
  )
}