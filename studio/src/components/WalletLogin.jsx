// src/components/WalletLogin.jsx
import { useState } from 'react'
import { ethers } from 'ethers'
import { generateCustomSeedPhrase, customSeedToPrivateKey } from '../utils/generateCustomSeed'

export default function WalletLogin({ onConnected }) {
  const [method, setMethod] = useState(null)
  const [mnemonicInput, setMnemonicInput] = useState('')
  const [generatedWallet, setGeneratedWallet] = useState(null)

  // 1) Metode MetaMask
  const handleMetamask = async () => {
    try {
      if (!window.ethereum) {
        alert("Metamask tidak terdeteksi.")
        return
      }
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      const sig = await signer.signMessage("Login to OperaDB Studio")
      onConnected({ address, signature: sig, type: 'metamask' })
    } catch (e) {
      console.error(e)
      alert("Gagal login dengan MetaMask.")
    }
  }

  // 2) Upload Seed Phrase (CUSTOM)
  const handleMnemonicLogin = () => {
    try {
      const phrase = mnemonicInput.trim().toLowerCase()
      if (!phrase) {
        alert("Seed phrase kosong.")
        return
      }

      // Derivasi privateKey via customSeedToPrivateKey
      const privateKey = customSeedToPrivateKey(phrase)
      const wallet = new ethers.Wallet(privateKey)
      onConnected({
        address: wallet.address,
        privateKey,
        mnemonic: phrase,
        type: 'custom'
      })
    } catch (e) {
      console.error(e)
      alert("Seed phrase custom tidak valid.")
    }
  }

  // 3) Generate Wallet Baru (CUSTOM)
  const generateWallet = async () => {
    try {
      const phrase = await generateCustomSeedPhrase()
      const privateKey = customSeedToPrivateKey(phrase)
      const wallet = new ethers.Wallet(privateKey)
      setGeneratedWallet({
        address: wallet.address,
        privateKey,
        mnemonic: phrase
      })
    } catch (e) {
      console.error(e)
      alert("Gagal membuat wallet custom.")
    }
  }

  // Download seed ke file .txt
  const downloadSeed = () => {
    if (!generatedWallet) return
    const blob = new Blob([generatedWallet.mnemonic], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'seed.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ maxWidth: 400, padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
      <h2>OperaDB Studio Login</h2>
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => setMethod('metamask')} style={{ marginRight: 8 }}>
          🔐 MetaMask
        </button>
        <button onClick={() => setMethod('upload')} style={{ marginRight: 8 }}>
          📥 Upload Seed Phrase
        </button>
        <button onClick={() => setMethod('generate')}>
          🪙 Generate Wallet
        </button>
      </div>

      {/* META MASK */}
      {method === 'metamask' && (
        <button onClick={handleMetamask}>🔓 Connect MetaMask</button>
      )}

      {/* UPLOAD SEED CUSTOM */}
      {method === 'upload' && (
        <div style={{ marginTop: 12 }}>
          <textarea
            rows="3"
            style={{ width: '100%' }}
            placeholder="Masukkan 12 kata seed custom"
            onChange={(e) => setMnemonicInput(e.target.value)}
          />
          <button onClick={handleMnemonicLogin} style={{ marginTop: 8 }}>
            Login
          </button>
        </div>
      )}

      {/* GENERATE WALLET CUSTOM */}
      {method === 'generate' && (
        <div style={{ marginTop: 12 }}>
          {generatedWallet ? (
            <>
              <p>
                <b>Seed Phrase (12 kata):</b>
              </p>
              <pre style={{ background: '#f9f9f9', padding: 8, borderRadius: 4 }}>
                {generatedWallet.mnemonic}
              </pre>
              <p>
                <b>Address:</b> {generatedWallet.address}
              </p>
              <button onClick={downloadSeed} style={{ marginRight: 8 }}>
                ⬇️ Download Seed
              </button>
              <button
                onClick={() =>
                  onConnected({
                    address: generatedWallet.address,
                    privateKey: generatedWallet.privateKey,
                    mnemonic: generatedWallet.mnemonic,
                    type: 'generated'
                  })
                }
                style={{ marginTop: 8 }}
              >
                Login dengan Wallet Baru
              </button>
            </>
          ) : (
            <button onClick={generateWallet}>🎲 Generate Wallet</button>
          )}
        </div>
      )}
    </div>
  )
}