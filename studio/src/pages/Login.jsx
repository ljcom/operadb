// src/pages/Login.jsx
import WalletLogin from '../components/WalletLogin'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()

  // onConnected menerima objek { address, privateKey?, mnemonic?, signature?, type }
  const handleConnected = (data) => {
    console.log("User connected:", data)
    // TODO: kamu bisa simpan data ini (address, privateKey) di Context / Redux / state
    // Setelah login, kita pivot ke halaman Dashboard
    navigate('/dashboard')
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
      <WalletLogin onConnected={handleConnected} />
    </div>
  )
}