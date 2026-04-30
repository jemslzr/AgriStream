// App.tsx - FINAL AGRISTREAM (With Scrolling Landing & Logo Home Link)
import { useState, useEffect, useCallback } from "react";

/* ─── DESIGN TOKENS (Your Earthy Palette) ─── */
const T = {
  soil:    "#1C1208",
  earth:   "#3B2A14",
  bark:    "#6B4C2A",
  wheat:   "#D4A94B",
  wheatLt: "#F0D080",
  lime:    "#7CC243",
  limeDk:  "#4E8A24",
  leaf:    "#2D6A1F",
  fog:     "#F5F2EC",
  parch:   "#EDE8DC",
  cream:   "#FDFAF4",
  mist:    "#C8C0B0",
  sky:     "#4A9EBF",
  danger:  "#C0392B",
  success: "#2E7D32",
  r:       "8px", 
};

/* ─── TYPES ─── */
type Page = "landing" | "dashboard" | "deploy" | "audit";

interface Disbursement {
  id: string; 
  farmer: string; 
  amount: number; 
  status: "ALLOCATED" | "CLAIMED";
  txHash: string; 
  createdAt: number; 
  program: string; 
  municipality: string;
}

/* ─── HELPERS ─── */
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
const fmt = (ts: number) => new Date(ts).toLocaleString("en-PH", { month:"short", day:"numeric", year:"numeric", hour:"numeric", minute:"2-digit" });
const shortAddr = (a: string) => `${a.slice(0,5)}…${a.slice(-4)}`;

const PROGRAMS = ["Typhoon Recovery Grant", "El Niño Drought Subsidy", "Flood Emergency Relief", "Seed & Fertilizer Aid"];

const STORAGE_KEY = "agristream_final_v2";
const load = (): Disbursement[] => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]"); } catch { return []; } };
const save = (e: Disbursement[]) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(e)); } catch {} };

/* ═══════════════════════════════════════════════════════════════
   ROOT APP
══════════════════════════════════════════════════════════════════ */
export default function App() {
  const [page, setPage] = useState<Page>("landing");
  const [addr, setAddr] = useState("");
  const [balance, setBalance] = useState(0);
  const [records, setRecords] = useState<Disbursement[]>(load);
  const [walletMsg, setWalletMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { isConnected, isAllowed, getAddress } = await import("@stellar/freighter-api");
        if (await isConnected() && await isAllowed()) {
          const r = await getAddress();
          if (r?.address) { setAddr(r.address); setBalance(9_992.95); }
        }
      } catch {}
    })();
  }, []);

  const persistRecords = (list: Disbursement[]) => { setRecords(list); save(list); };

  const connect = async () => {
    setWalletMsg("");
    try {
      const { isConnected, requestAccess, getAddress } = await import("@stellar/freighter-api");
      if (!await isConnected()) { setWalletMsg("Please install Freighter at freighter.app"); return; }
      await requestAccess();
      const r = await getAddress();
      if (r?.address) { setAddr(r.address); setBalance(9_992.95); setPage("dashboard"); }
      else setWalletMsg("Could not retrieve address.");
    } catch { setWalletMsg("Connection failed."); }
  };
  
  const disconnect = () => { setAddr(""); setBalance(0); setPage("landing"); };

  /* ── SMART CONTRACT CALL (Working Backend) ── */
  const deployFunds = useCallback(async (
    farmer: string, amount: number, program: string, municipality: string
  ): Promise<{success:boolean; message:string; hash?:string}> => {
    if (!addr) return {success:false, message:"NGO Wallet not connected."};
    
    try {
      const { signTransaction } = await import("@stellar/freighter-api");
      const sdk = await import("@stellar/stellar-sdk");
      const { rpc, TransactionBuilder, Networks, Contract, Address, nativeToScVal } = sdk;

      const server = new rpc.Server("https://soroban-testnet.stellar.org");
      const CONTRACT = "CCXYD7JYJSKI7WWKI7Y7P3DDD4NSL7F3U5EQAF2UUO7QFBRCIEL3FHQE";
      const src = await server.getAccount(addr);
      
      const call = new Contract(CONTRACT).call(
        "allocate",
        new Address(addr).toScVal(),
        new Address(farmer).toScVal(),
        nativeToScVal(Math.round(amount * 10_000_000), {type:"i128"})
      );
      
      const tx = new TransactionBuilder(src, {fee:"10000", networkPassphrase:Networks.TESTNET})
        .addOperation(call).setTimeout(30).build();
      const prep = await server.prepareTransaction(tx);
      const signed = await signTransaction(prep.toXDR(), {networkPassphrase:Networks.TESTNET});
      if (signed.error) throw new Error(signed.error);
      const final = TransactionBuilder.fromXDR(signed.signedTxXdr, Networks.TESTNET);
      const resp = await server.sendTransaction(final);
      
      if (resp.status !== "PENDING") throw new Error("Network submission failed.");
      const hash = resp.hash;

      const rec: Disbursement = {
        id:`AID-${Math.floor(Math.random()*10000)}`, farmer, amount, program, municipality,
        status:"ALLOCATED", txHash:hash, createdAt:Date.now()
      };
      
      persistRecords([rec, ...records]);
      setBalance(b => parseFloat((b - amount).toFixed(2)));
      return {success:true, message:`Aid secured on-chain! TX: ${hash.slice(0,10)}…`, hash};
    } catch (err: any) {
      console.error(err);
      if (/reject|decline/i.test(String(err))) return {success:false, message:"Transaction rejected by NGO Admin."};
      return {success:false, message:`Contract Error. Check console.`};
    }
  }, [addr, records]);

  /* ── NAVIGATION (Dark Theme) ── */
  const Nav = () => (
    <nav style={{
      position:"sticky", top:0, zIndex:200, display:"flex", alignItems:"center", gap:0,
      background:T.soil, borderBottom:`1px solid ${T.earth}`, padding:"0 2rem", height:"60px",
    }}>
      {/* LOGO NOW ALWAYS GOES TO LANDING PAGE */}
      <button onClick={() => setPage("landing")} style={{
        background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:"10px", marginRight:"2rem", padding:0,
      }}>
        <span style={{fontSize:"24px"}}>🌱</span>
        <span style={{fontFamily:"'DM Serif Display',Georgia,serif", fontSize:"1.3rem", color:T.wheat, letterSpacing:"0.02em"}}>AgriStream</span>
      </button>

      {addr && (["dashboard","deploy","audit"] as Page[]).map(p => (
        <button key={p} onClick={() => setPage(p)} style={{
          background:"none", border:"none", cursor:"pointer", color: page===p ? T.wheat : T.mist,
          fontFamily:"'DM Mono',monospace", fontSize:"0.72rem", fontWeight:600, letterSpacing:"0.1em",
          padding:"0 1.1rem", height:"60px", borderBottom: page===p ? `2px solid ${T.wheat}` : "2px solid transparent",
          textTransform:"uppercase", transition:"color 0.15s",
        }}>
          {p === "dashboard" ? "NGO Dashboard" : p === "deploy" ? "Allocate Aid" : "Audit Trail"}
        </button>
      ))}
      <div style={{marginLeft:"auto"}}>
        {addr ? (
          <div style={{display:"flex", alignItems:"center", gap:"0.75rem"}}>
            <div style={{background:T.earth, border:`1px solid ${T.bark}`, borderRadius:T.r, padding:"0.35rem 0.9rem", fontFamily:"'DM Mono',monospace", fontSize:"0.72rem", color:T.wheat}}>
              🔗 {shortAddr(addr)}
            </div>
            <button onClick={disconnect} style={{background:"none", border:`1px solid ${T.bark}`, borderRadius:T.r, color:T.mist, fontFamily:"'DM Mono',monospace", fontSize:"0.7rem", padding:"0.35rem 0.9rem", cursor:"pointer"}}>Disconnect</button>
          </div>
        ) : (
          <button onClick={connect} style={{background:T.lime, color:T.soil, border:"none", borderRadius:T.r, fontFamily:"'DM Mono',monospace", fontWeight:700, fontSize:"0.75rem", letterSpacing:"0.08em", padding:"0.6rem 1.4rem", cursor:"pointer"}}>NGO LOGIN</button>
        )}
      </div>
    </nav>
  );

  return (
    <div style={{minHeight:"100vh", background: page === "landing" ? T.soil : T.fog, fontFamily:"'DM Sans',system-ui,sans-serif", color:T.soil}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        input,select { font-family:'DM Sans',sans-serif; }
        input:focus,select:focus { outline: 2px solid ${T.lime}; outline-offset: 1px; }
        .fadeUp{animation:fadeUp 0.5s ease forwards} .fadeUp2{animation:fadeUp 0.5s 0.15s ease both} .fadeUp3{animation:fadeUp 0.5s 0.3s ease both}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
      <Nav />
      {walletMsg && <div style={{background:T.wheatLt, padding:"1rem", textAlign:"center", fontSize:"0.9rem", fontWeight:600}}>{walletMsg}</div>}
      
      {page === "landing" ? (
        <Landing connect={connect} />
      ) : (
        <main style={{padding:"3rem 2rem", maxWidth:"1000px", margin:"0 auto"}}>
          {page === "dashboard" && <Dashboard balance={balance} records={records} setPage={setPage} />}
          {page === "deploy"    && <DeployAid addr={addr} onDeploy={deployFunds} setPage={setPage} />}
          {page === "audit"     && <AuditTrail records={records} />}
        </main>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   1. LANDING PAGE (With Scrollable Sections)
══════════════════════════════════════════════════════════════════ */
function Landing({ connect }: { connect: () => void }) {
  return (
    <div>
      {/* Hero Section */}
      <section style={{
        background:T.soil, minHeight:"90vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"5rem 2rem", textAlign:"center", position:"relative", overflow:"hidden",
      }}>
        <div style={{position:"absolute", width:"600px", height:"600px", borderRadius:"50%", border:`1px solid ${T.earth}`, top:"50%", left:"50%", transform:"translate(-50%,-50%)", opacity:0.4, pointerEvents:"none"}}/>
        <div style={{position:"absolute", width:"400px", height:"400px", borderRadius:"50%", border:`1px solid ${T.earth}`, top:"50%", left:"50%", transform:"translate(-50%,-50%)", opacity:0.5, pointerEvents:"none"}}/>

        <div className="fadeUp" style={{background:T.earth, border:`1px solid ${T.bark}`, borderRadius:"100px", padding:"0.35rem 1.1rem", fontSize:"0.72rem", fontFamily:"'DM Mono',monospace", color:T.wheat, letterSpacing:"0.1em", marginBottom:"2rem", display:"inline-block"}}>AgriStream: Disaster Relief</div>

        <h1 className="fadeUp2" style={{fontFamily:"'DM Serif Display',Georgia,serif", fontSize:"clamp(2.8rem,7vw,5.5rem)", color:"#fff", lineHeight:1.1, maxWidth:"780px", marginBottom:"1.5rem"}}>
          Immediate disaster relief.<br/>
          <em style={{color:T.wheat}}>Zero red tape.</em>
        </h1>

        <p className="fadeUp3" style={{fontSize:"clamp(1rem,2vw,1.2rem)", color:T.mist, maxWidth:"560px", lineHeight:1.7, marginBottom:"3rem"}}>
          When a typhoon hits, farmers lose their livelihood in hours. AgriStream allows NGOs to deploy USDC aid instantly via Soroban smart contracts directly to farmers.
        </p>

        <div className="fadeUp3" style={{display:"flex", gap:"1rem", flexWrap:"wrap", justifyContent:"center"}}>
          <button onClick={connect} style={{background:T.lime, color:T.soil, border:"none", borderRadius:T.r, fontFamily:"'DM Mono',monospace", fontWeight:700, fontSize:"0.9rem", letterSpacing:"0.06em", padding:"1rem 2.5rem", cursor:"pointer", transition:"transform 0.15s"}}
          onMouseEnter={e => (e.currentTarget.style.transform="scale(1.03)")} onMouseLeave={e => (e.currentTarget.style.transform="scale(1)")}>
            NGO Login →
          </button>
          <a href="https://stellar.expert/explorer/testnet/contract/CCXYD7JYJSKI7WWKI7Y7P3DDD4NSL7F3U5EQAF2UUO7QFBRCIEL3FHQE" target="_blank" rel="noreferrer" style={{background:"none", color:T.mist, border:`1px solid ${T.bark}`, borderRadius:T.r, fontFamily:"'DM Mono',monospace", fontSize:"0.85rem", padding:"1rem 2.5rem", cursor:"pointer", textDecoration:"none"}}>View Contract ↗</a>
        </div>
      </section>

      {/* Problem Section */}
      <section style={{background:T.parch, padding:"5rem 2rem"}}>
        <div style={{maxWidth:"900px", margin:"0 auto"}}>
          <div style={{textAlign:"center", marginBottom:"3.5rem"}}>
            <div style={{fontFamily:"'DM Mono',monospace", fontSize:"0.7rem", letterSpacing:"0.15em", color:T.bark, marginBottom:"0.75rem"}}>THE PROBLEM</div>
            <h2 style={{fontFamily:"'DM Serif Display',serif", fontSize:"clamp(1.8rem,4vw,3rem)", color:T.soil, lineHeight:1.2}}>The cycle of debt starts<br/>when aid is delayed.</h2>
          </div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem"}}>
            {[
              {icon:"⏳", title:"The 4-Week Delay", color:T.wheat, items:["Traditional NGO relief takes 2 to 4 weeks","Delayed by manual verification and logistics","Funds stuck in bank processing friction"]},
              {icon:"📉", title:"The Cycle of Debt", color:T.danger, items:["Desperate farmers forced into high-interest loans","Future profits wiped out just to survive","Local supply chains collapse without immediate capital"]},
            ].map(card => (
              <div key={card.title} style={{background:T.cream, border:`1.5px solid ${T.mist}`, borderRadius:T.r, padding:"2rem"}}>
                <div style={{fontSize:"2rem", marginBottom:"0.75rem"}}>{card.icon}</div>
                <h3 style={{fontFamily:"'DM Serif Display',serif", fontSize:"1.35rem", marginBottom:"1rem", color:T.soil}}>{card.title}</h3>
                {card.items.map(i => (
                  <div key={i} style={{display:"flex", gap:"0.6rem", alignItems:"flex-start", marginBottom:"0.6rem"}}>
                    <span style={{color:card.color, marginTop:"2px", flexShrink:0}}>▶</span>
                    <span style={{fontSize:"0.875rem", color:T.bark, lineHeight:1.5}}>{i}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section style={{background:T.soil, padding:"5rem 2rem"}}>
        <div style={{maxWidth:"900px", margin:"0 auto"}}>
          <div style={{textAlign:"center", marginBottom:"3.5rem"}}>
            <div style={{fontFamily:"'DM Mono',monospace", fontSize:"0.7rem", letterSpacing:"0.15em", color:T.bark, marginBottom:"0.75rem"}}>THE SOLUTION</div>
            <h2 style={{fontFamily:"'DM Serif Display',serif", fontSize:"clamp(1.8rem,4vw,3rem)", color:"#fff", lineHeight:1.2}}>Zero intermediaries.<br/><span style={{color:T.wheat}}>Just code and compassion.</span></h2>
          </div>
          <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1.5rem"}}>
            {[
              {n:"01", title:"NGO Locks Funds", desc:"Administrators pre-fund relief pools securely in a Soroban smart contract.", icon:"🔒"},
              {n:"02", title:"Instant Allocation", desc:"When disaster strikes, USDC is allocated instantly to verified farmer addresses.", icon:"⚡"},
              {n:"03", title:"Direct Claim", desc:"Farmers claim 100% of the aid instantly with sub-cent transaction fees.", icon:"✅"},
            ].map(step => (
              <div key={step.n} style={{borderTop:`2px solid ${T.bark}`, paddingTop:"1.5rem"}}>
                <div style={{fontFamily:"'DM Mono',monospace", fontSize:"0.7rem", color:T.wheat, letterSpacing:"0.1em", marginBottom:"1rem"}}>{step.n}</div>
                <div style={{fontSize:"2rem", marginBottom:"0.75rem"}}>{step.icon}</div>
                <h3 style={{fontFamily:"'DM Serif Display',serif", fontSize:"1.15rem", color:"#fff", marginBottom:"0.6rem"}}>{step.title}</h3>
                <p style={{fontSize:"0.85rem", color:T.mist, lineHeight:1.6}}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   2. DASHBOARD (Mission Control Green Box Layout)
══════════════════════════════════════════════════════════════════ */
function Dashboard({ balance, records, setPage }: { balance: number; records: Disbursement[]; setPage: (p:Page)=>void }) {
  const totalDeployed = records.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="fadeUp">
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:"2rem"}}>
        <div>
          <h2 style={{fontFamily:"'DM Serif Display',serif", fontSize:"2.5rem", color:T.soil}}>Mission Status</h2>
          <p style={{color:T.bark}}>Overview of your organization's relief efforts.</p>
        </div>
        <button onClick={() => setPage("deploy")} style={{ background:T.soil, color:T.cream, padding:"0.8rem 1.5rem", borderRadius:T.r, border:"none", fontWeight:600, cursor:"pointer" }}>
          + Deploy Emergency Aid
        </button>
      </div>

      <div style={{display:"flex", gap:"1.5rem", marginBottom:"3rem"}}>
        <div style={{flex:1.5, background:T.lime, padding:"2.5rem", borderRadius:T.r, color:T.soil, display:"flex", flexDirection:"column", justifyContent:"space-between", boxShadow:"0 5px 15px rgba(124, 194, 67, 0.2)"}}>
          <span style={{fontWeight:700, fontSize:"0.9rem", textTransform:"uppercase", letterSpacing:"1px"}}>Available Mission Fund</span>
          <div style={{fontSize:"3.5rem", fontWeight:700, marginTop:"1rem"}}>{balance.toLocaleString()} <span style={{fontSize:"1.2rem", fontWeight:600}}>USDC</span></div>
        </div>
        
        <div style={{flex:1, display:"flex", flexDirection:"column", gap:"1.5rem"}}>
          <div style={{background:T.cream, padding:"2rem", borderRadius:T.r, border:`1px solid ${T.mist}`, flex:1}}>
            <span style={{fontWeight:600, fontSize:"0.85rem", color:T.bark, textTransform:"uppercase"}}>Total Aid Deployed</span>
            <div style={{fontSize:"2rem", fontWeight:700, color:T.soil, marginTop:"0.5rem"}}>{totalDeployed.toLocaleString()} USDC</div>
          </div>
          <div style={{background:T.cream, padding:"2rem", borderRadius:T.r, border:`1px solid ${T.mist}`, flex:1}}>
            <span style={{fontWeight:600, fontSize:"0.85rem", color:T.bark, textTransform:"uppercase"}}>Farmers Reached</span>
            <div style={{fontSize:"2rem", fontWeight:700, color:T.soil, marginTop:"0.5rem"}}>{records.length} Families</div>
          </div>
        </div>
      </div>

      <h3 style={{fontSize:"1.5rem", marginBottom:"1rem", color:T.soil, fontFamily:"'DM Serif Display',serif"}}>Recent Disbursements</h3>
      <div style={{background:T.cream, borderRadius:T.r, border:`1px solid ${T.mist}`, padding:"1rem" }}>
        {records.length === 0 ? <p style={{padding:"2rem", textAlign:"center", color:T.bark}}>No relief deployed yet.</p> : 
          records.slice(0,5).map(r => (
            <div key={r.id} style={{display:"flex", justifyContent:"space-between", padding:"1rem", borderBottom:`1px solid ${T.parch}`}}>
              <div>
                <div style={{fontWeight:600, color:T.soil}}>{r.program} • {r.municipality}</div>
                <div style={{fontSize:"0.85rem", color:T.bark, marginTop:"0.2rem"}}>Beneficiary: {shortAddr(r.farmer)}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontWeight:700, color:T.limeDk}}>{r.amount} USDC</div>
                <div style={{fontSize:"0.8rem", color:T.bark}}>{fmt(r.createdAt)}</div>
              </div>
            </div>
          ))
        }
        {records.length > 0 && <div style={{textAlign:"center", paddingTop:"1rem"}}><button onClick={()=>setPage("audit")} style={{background:"none", border:"none", color:T.limeDk, fontWeight:600, cursor:"pointer"}}>View Full Audit Trail →</button></div>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   3. DEPLOY AID (Centered Form)
══════════════════════════════════════════════════════════════════ */
function DeployAid({ onDeploy, setPage }: { addr?: string; onDeploy: any; setPage: (p:Page)=>void }) {
  const [farmer, setFarmer] = useState("");
  const [amount, setAmount] = useState("");
  const [program, setProgram] = useState("");
  const [muni, setMuni] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus("Initiating Soroban secure transfer...");
    await delay(1000);
    setStatus("Please sign the transaction in Freighter...");
    const res = await onDeploy(farmer, +amount, program, muni);
    setStatus(res.message);
    setBusy(false);
    if(res.success) { setFarmer(""); setAmount(""); setProgram(""); setMuni(""); }
  }

  const inputStyle = { width:"100%", padding:"1rem", borderRadius:T.r, border:`1px solid ${T.mist}`, background:T.cream, fontSize:"1rem" };

  return (
    <div className="fadeUp" style={{maxWidth:"650px", margin:"0 auto"}}>
      <button onClick={()=>setPage("dashboard")} style={{background:"none", border:"none", cursor:"pointer", color:T.bark, marginBottom:"1.5rem"}}>← Back to Dashboard</button>
      
      <div style={{background:"white", padding:"3rem", borderRadius:T.r, boxShadow:"0 5px 15px rgba(0,0,0,0.03)"}}>
        <h2 style={{fontFamily:"'DM Serif Display',serif", fontSize:"2.2rem", color:T.soil, marginBottom:"0.5rem"}}>Disburse Relief Funds</h2>
        <p style={{color:T.bark, marginBottom:"2.5rem"}}>Execute a direct, on-chain transfer to a verified farmer.</p>

        <form onSubmit={submit} style={{display:"flex", flexDirection:"column", gap:"1.5rem"}}>
          
          <div>
            <label style={{display:"block", fontSize:"0.85rem", fontWeight:600, color:T.bark, marginBottom:"0.5rem", textTransform:"uppercase"}}>Disaster Relief Program</label>
            <select style={inputStyle} value={program} onChange={e=>setProgram(e.target.value)} required disabled={busy}>
              <option value="">Select Official Program...</option>
              {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div style={{display:"flex", gap:"1rem"}}>
            <div style={{flex:1}}>
              <label style={{display:"block", fontSize:"0.85rem", fontWeight:600, color:T.bark, marginBottom:"0.5rem", textTransform:"uppercase"}}>Municipality/Province</label>
              <input style={inputStyle} value={muni} onChange={e=>setMuni(e.target.value)} placeholder="e.g. Rizal, Nueva Ecija" required disabled={busy} />
            </div>
            <div style={{flex:1}}>
              <label style={{display:"block", fontSize:"0.85rem", fontWeight:600, color:T.bark, marginBottom:"0.5rem", textTransform:"uppercase"}}>Subsidy Amount (USDC)</label>
              <input style={inputStyle} type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" min="1" required disabled={busy} />
            </div>
          </div>

          <div>
            <label style={{display:"block", fontSize:"0.85rem", fontWeight:600, color:T.bark, marginBottom:"0.5rem", textTransform:"uppercase"}}>Farmer Stellar Address (Beneficiary)</label>
            <input style={inputStyle} value={farmer} onChange={e=>setFarmer(e.target.value)} placeholder="G..." minLength={56} maxLength={56} required disabled={busy} />
          </div>

          <div style={{background:T.parch, padding:"1.5rem", borderRadius:T.r, marginTop:"1rem"}}>
            <div style={{display:"flex", justifyContent:"space-between", marginBottom:"1rem", fontWeight:600, fontSize:"0.95rem"}}>
              <span style={{color: T.soil}}>Network Cost:</span>
              <span><span style={{color:T.success}}>Covered by NGO</span> (10,000 stroops)</span>
            </div>
            <button type="submit" disabled={busy} style={{ width:"100%", background: busy ? T.mist : T.limeDk, color:"white", border:"none", padding:"1.2rem", borderRadius:T.r, fontSize:"1.1rem", fontWeight:700, cursor:busy ? "not-allowed" : "pointer", transition:"background 0.2s" }}>
              {busy ? "Processing on Testnet..." : `Authorize ${amount ? amount : '0.00'} USDC Transfer`}
            </button>
          </div>

          {status && (
            <div style={{padding:"1rem", background:status.includes("Error")||status.includes("rejected") ? "#FEE2E2" : "#DCFCE7", color:status.includes("Error")||status.includes("rejected") ? T.danger : T.success, borderRadius:T.r, textAlign:"center", fontWeight:600}}>
              {status}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   4. AUDIT TRAIL (Dark Table)
══════════════════════════════════════════════════════════════════ */
function AuditTrail({ records }: { records: Disbursement[] }) {
  return (
    <div className="fadeUp">
      <h2 style={{fontFamily:"'DM Serif Display',serif", fontSize:"2.5rem", color:T.soil, marginBottom:"0.5rem"}}>Public Audit Trail</h2>
      <p style={{color:T.bark, marginBottom:"2rem"}}>Transparent ledger of all NGO relief disbursements. Verifiable on the Stellar blockchain.</p>

      <div style={{background:"white", borderRadius:T.r, boxShadow:"0 5px 15px rgba(0,0,0,0.05)", overflow:"hidden"}}>
        <table style={{width:"100%", borderCollapse:"collapse", textAlign:"left"}}>
          <thead style={{background:T.soil, color:T.cream}}>
            <tr>
              <th style={{padding:"1.2rem 1rem", fontWeight:600, fontSize:"0.9rem"}}>Date / Time</th>
              <th style={{padding:"1.2rem 1rem", fontWeight:600, fontSize:"0.9rem"}}>Relief Program</th>
              <th style={{padding:"1.2rem 1rem", fontWeight:600, fontSize:"0.9rem"}}>Beneficiary</th>
              <th style={{padding:"1.2rem 1rem", fontWeight:600, fontSize:"0.9rem"}}>Amount</th>
              <th style={{padding:"1.2rem 1rem", fontWeight:600, fontSize:"0.9rem"}}>On-Chain Proof</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan={5} style={{padding:"3rem", textAlign:"center", color:T.bark}}>No records exist yet.</td></tr>
            ) : (
              records.map((r, i) => (
                <tr key={r.id} style={{borderBottom:`1px solid ${T.parch}`, background: i % 2 === 0 ? "white" : T.fog}}>
                  <td style={{padding:"1rem", fontSize:"0.9rem", color:T.bark}}>{fmt(r.createdAt)}</td>
                  <td style={{padding:"1rem", fontWeight:600, color:T.soil}}>{r.program}<br/><span style={{fontSize:"0.8rem", color:T.bark, fontWeight:400}}>{r.municipality}</span></td>
                  <td style={{padding:"1rem", fontFamily:"monospace", color:T.bark}}>{shortAddr(r.farmer)}</td>
                  <td style={{padding:"1rem", fontWeight:700, color:T.success}}>{r.amount} USDC</td>
                  <td style={{padding:"1rem"}}>
                    <a href={`https://stellar.expert/explorer/testnet/tx/${r.txHash}`} target="_blank" rel="noreferrer" style={{color:T.sky, textDecoration:"none", fontWeight:600, fontSize:"0.85rem"}}>
                      View TX ↗
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}