// src/components/WalletLogin.jsx

import { useState } from 'react'
import { ethers } from 'ethers'
import { generateCustomSeedPhrase, customSeedToPrivateKey } from '../utils/generateCustomSeed'  // ← import di sini

export default function WalletLogin({ onConnected }) {
    const [method, setMethod] = useState(null)
    const [mnemonicInput, setMnemonicInput] = useState('')
    const [generatedWallet, setGeneratedWallet] = useState(null)

    const handleMetamask = async () => {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum)
            const signer = await provider.getSigner()
            const address = await signer.getAddress()
            const sig = await signer.signMessage("Login to OperaDB Studio")
            onConnected({ address, signature: sig, type: 'metamask' })
        } catch {
            alert("Gagal login dengan MetaMask")
        }
    }

    const handleMnemonicLogin = () => {
        try {
            // asumsikan user masukkan seed custom (12 kata dari allwords.json)
            const seedPhrase = mnemonicInput.trim()
            // Derive privateKey pakai keccak256, bukan fromPhrase
            const privateKey = customSeedToPrivateKey(seedPhrase)
            const wallet = new ethers.Wallet(privateKey)
            onConnected({
                address: wallet.address,
                privateKey,
                mnemonic: seedPhrase,
                type: 'custom'
            })
        } catch {
            alert("Seed phrase custom tidak valid.")
        }
    }

    // Fungsi generateWallet sekarang memanggil generateCustomSeedPhrase()
    const generateWallet = async () => {
        try {
            // Panggil helper untuk membuat 12 kata random (dari generateCustomSeedPhrase)
            const phrase = await generateCustomSeedPhrase()
            // Derivasi privateKey dengan customSeedToPrivateKey
            const privateKey = customSeedToPrivateKey(phrase)
            // Buat wallet dari privateKey hasil hash
            const wallet = new ethers.Wallet(privateKey)
            // Simpan hasilnya di state agar ditampilkan di UI
            setGeneratedWallet({
                address: wallet.address,
                privateKey,
                mnemonic: phrase
            })
        } catch {
            alert("Gagal membuat wallet custom.")
        }
    }

    const downloadSeed = () => {
        if (!generatedWallet) return
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
            <div>
                <button onClick={() => setMethod('metamask')}>🔐 MetaMask</button>
                <button onClick={() => setMethod('upload')}>📥 Upload Seed Phrase</button>
                <button onClick={() => setMethod('generate')}>🪙 Generate Wallet</button>
            </div>

            {method === 'metamask' && (
                <button onClick={handleMetamask}>🔓 Connect MetaMask</button>
            )}

            {method === 'upload' && (
                <div>
                    <textarea
                        rows="3"
                        placeholder="masukkan 12/24 kata seed phrase"
                        onChange={(e) => setMnemonicInput(e.target.value)}
                    />
                    <br />
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
                                mnemonic: generatedWallet.mnemonic.phrase,
                                type: 'generated'
                            })}>
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