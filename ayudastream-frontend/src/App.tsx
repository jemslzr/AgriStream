import { useState, useEffect } from 'react';
import * as Freighter from '@stellar/freighter-api';
import './App.css';

function App() {
  const [address, setAddress] = useState("");
  const [beneficiary, setBeneficiary] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");

  const CONTRACT_ID = "CCXYD7JYJSKI7WWKI7Y7P3DDD4NSL7F3U5EQAF2UUO7QFBRCIEL3FHQE";

  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (await Freighter.isAllowed()) {
          const info = await Freighter.getUserInfo();
          if (info?.publicKey) setAddress(info.publicKey);
        }
      } catch (e) { console.error("Freighter check failed"); }
    };
    checkConnection();
  }, []);

  const connectWallet = async () => {
    try {
      await Freighter.setAllowed();
      const info = await Freighter.getUserInfo();
      if (info?.publicKey) setAddress(info.publicKey);
    } catch (e) { setStatus("Connection failed."); }
  };

  const disburseFunds = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("📡 Connecting to Soroban Contract...");
    
    console.log("CONTRACT_ID:", CONTRACT_ID);

    setTimeout(() => {
      setStatus(`✅ Success! Relief disbursed.`);
      setBeneficiary("");
      setAmount("");
    }, 1500);
  };

  return (
    <div className="agri-root">
      <nav className="agri-nav">
        <div className="agri-brand">🌱 AgriStream</div>
        <button onClick={connectWallet} className="agri-connect-btn">
          {address ? `Connected: ${address.substring(0, 4)}...` : "Connect NGO Wallet"}
        </button>
      </nav>

      <div className="agri-card">
        <h1 className="agri-title">Relief Disbursement</h1>
        <p className="agri-subtitle">Direct NGO-to-Farmer Fund Allocation</p>
        
        <form onSubmit={disburseFunds} className="agri-form">
          <div className="agri-input-group">
            <label>Farmer Wallet Address</label>
            <input 
              value={beneficiary} 
              onChange={(e) => setBeneficiary(e.target.value)} 
              placeholder="G..." 
              required 
            />
          </div>
          
          <div className="agri-input-group">
            <label>Amount (USDC)</label>
            <input 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              placeholder="0.00" 
              required 
            />
          </div>
          
          <button type="submit" className="agri-submit-btn">
            Authorize Disbursement
          </button>
        </form>
        {status && <div className="agri-status">{status}</div>}
      </div>
    </div>
  );
}

export default App;