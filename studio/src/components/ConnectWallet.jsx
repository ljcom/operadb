import { useState } from 'react'
import { ethers } from 'ethers'

export default function ConnectWallet({ onConnected }) {
  const [address, setAddress] = useState(null)

  async function connect() {
    if (!window.ethereum) return alert("Metamask tidak ditemukan.")
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    const addr = await signer.getAddress()
    const msg = "Login to OperaDB Studio"
    const sig = await signer.signMessage(msg)

    setAddress(addr)
    onConnected({ address: addr, signature: sig })
  }

  return (
    <div>
      {address ? (
        <p>Connected: {address}</p>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
    </div>
  )
}