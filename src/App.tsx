import { useState, useEffect } from 'react';
import './index.css';

export default function App() {
  // ================= ESTADOS =================
  const [isLoading, setIsLoading] = useState(true); // Control de carga inicial
  const [activeScreen, setActiveScreen] = useState(1);

  const [divisas, setDivisas] = useState({
    uf: { price: '', change: 0 },
    dolar: { price: '', change: 0 },
    euro: { price: '', change: 0 },
    ipsa: { price: '', change: 0 },
  });

  const [acciones, setAcciones] = useState<any[]>([]);

  // ================= 1. DESCARGA DE DATOS (PRE-FETCH Y BACKGROUND) =================
  const fetchAllData = async () => {
    const nuevasDivisas = { ...divisas };

    // 1. OBTENER UF (Desde Mindicador)
    try {
      const resUf = await fetch('https://mindicador.cl/api/uf');
      const dataUf = await resUf.json();
      const precioHoyUf = dataUf.serie[0].valor;
      const precioAyerUf = dataUf.serie[1].valor;
      nuevasDivisas.uf = {
        price: precioHoyUf,
        change: ((precioHoyUf - precioAyerUf) / precioAyerUf) * 100,
      };
    } catch (error) {
      console.error('Error UF:', error);
    }

    // 2. OBTENER DÓLAR, EURO E IPSA
    const divisasTickers = {
      dolar: 'CLP=X',
      euro: 'EURCLP=X',
      ipsa: '^IPSA',
    };
    for (const [key, ticker] of Object.entries(divisasTickers)) {
      try {
        const response = await fetch(
          `https://api-universal-finanzas.onrender.com/api/datos?ticker=${ticker}&periodo=1mo`
        );
        const data = await response.json();
        if (
          data.status === 'success' &&
          data.datos &&
          data.datos.length > 0
        ) {
          const regs = data.datos;
          const pHoy = regs[regs.length - 1].precio_cierre;
          const pAyer =
            regs.length > 1 ? regs[regs.length - 2].precio_cierre : pHoy;
          nuevasDivisas[key as keyof typeof nuevasDivisas] = {
            price: pHoy,
            change: ((pHoy - pAyer) / pAyer) * 100,
          };
        }
      } catch (error) {
        console.error(`Error API:`, error);
      }
    }
    
    setDivisas((prev) => ({ ...prev, ...nuevasDivisas }));

    // 3. OBTENER ACCIONES (Actualizado a Junio)
    const diccionarioEmpresas: Record<string, any> = {
      'SQM-B.SN': { tickerVisual: 'SQM-B', nombre: 'Química Minera' },
      'CHILE.SN': { tickerVisual: 'CHILE', nombre: 'Banco de Chile' },
      'VAPORES.SN': { tickerVisual: 'VAPORES', nombre: 'CSAV' },
      'LTM.SN': { tickerVisual: 'LTM', nombre: 'Latam Airlines' },
      'FALABELLA.SN': { tickerVisual: 'FALABELLA', nombre: 'Falabella S.A.' }
    };

    const topDelMes = [
      'SQM-B.SN',
      'CHILE.SN',
      'VAPORES.SN',
      'LTM.SN',
      'FALABELLA.SN',
    ];
    const nuevasAcciones = [];

    for (const ticker of topDelMes) {
      try {
        const response = await fetch(
          `https://api-universal-finanzas.onrender.com/api/datos?ticker=${ticker}&periodo=1mo`
        );
        const data = await response.json();
        if (
          data.status === 'success' &&
          data.datos &&
          data.datos.length > 0
        ) {
          const regs = data.datos;
          const pHoy = regs[regs.length - 1].precio_cierre;
          const pAyer =
            regs.length > 1 ? regs[regs.length - 2].precio_cierre : pHoy;
          const info = diccionarioEmpresas[ticker] || {
            tickerVisual: ticker,
            nombre: 'Empresa',
          };

          nuevasAcciones.push({
            id: ticker,
            tickerVisual: info.tickerVisual,
            nombre: info.nombre,
            price: pHoy,
            change: ((pHoy - pAyer) / pAyer) * 100,
            isCLP: true, // Todas en pesos chilenos
          });
        }
      } catch (error) {
        console.error(`Error Acción:`, error);
      }
    }
    
    if(nuevasAcciones.length > 0) {
      setAcciones(nuevasAcciones);
    }
  };

  // Efecto inicial: Carga los datos por primera vez
  useEffect(() => {
    let isMounted = true;
    
    const initializeApp = async () => {
      // Obliga a que la pantalla de carga se muestre al menos 2.5 segs
      await Promise.all([
        fetchAllData(),
        new Promise((resolve) => setTimeout(resolve, 2500)),
      ]);

      if (isMounted) {
        setIsLoading(false);
      }
    };
    
    initializeApp();

    // Recarga silenciosa cada 5 minutos
    const backgroundRefresh = setInterval(() => {
      fetchAllData();
    }, 300000);

    return () => {
      isMounted = false;
      clearInterval(backgroundRefresh);
    };
  }, []);

  // ================= 2. CARRUSEL DE FASES =================
  useEffect(() => {
    if (isLoading) return;

    let duration = 10000; // 10 segundos
    
    // Si es la pantalla de transición rápida (fase 4), dura 1 segundo
    if (activeScreen === 4) {
      duration = 1000; 
    }

    const timer = setTimeout(() => {
      setActiveScreen((prev) => {
        if (prev === 1) return 2;
        if (prev === 2) return 3;
        if (prev === 3) return 4; // Transición rápida
        return 1;
      });
    }, duration);
    
    return () => clearTimeout(timer);
  }, [activeScreen, isLoading]);

  // ================= 3. COMPONENTES VISUALES =================
  const ArrowUp = () => (
    <svg
      style={{ width: '1vh', height: '1vh' }}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
  const ArrowDown = () => (
    <svg
      style={{ width: '1vh', height: '1vh' }}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M19 12l-7 7-7-7" />
    </svg>
  );

  const renderPill = (changeValue: any) => {
    if (changeValue === '' || isNaN(changeValue)) return null;
    const isPositive = parseFloat(changeValue) >= 0;
    const formattedChange = Math.abs(parseFloat(changeValue)).toFixed(2);
    return isPositive ? (
      <div className="pill green">
        <ArrowUp /> {formattedChange}%
      </div>
    ) : (
      <div className="pill red">
        <ArrowDown /> {formattedChange}%
      </div>
    );
  };

  const formatNumber = (value: any, isCurrency = true, prefix = '$') => {
    if (!value || isNaN(value)) return '0,00';
    const num = parseFloat(value);
    return (
      (isCurrency ? prefix : '') +
      num.toLocaleString('es-CL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };

  const Header = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div className="header-top epic-enter delay-1">
      <div>
        <div className="main-title">{title}</div>
        <div className="sub-title">{subtitle}</div>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
        }}
      >
        <img
          src="/logo.png"
          alt="Logo"
          className="header-logo"
          style={{ marginBottom: '0.5vh', width: 'auto' }}
        />
        <div className="live-indicator">
          <span className="live-dot"></span> EN VIVO
        </div>
      </div>
    </div>
  );

  // === COMPONENTE: PANTALLA DE CARGA / TRANSICIÓN ===
  const TransitionScreen = () => (
    <div className="screen-container epic-enter" style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        width: '100%',
        gap: '4vh'
    }}>
      <img src="/logo.png" alt="NexApp" style={{ width: '25vh' }} />
      
      {/* Flecha verde dinámica de recarga */}
      <svg 
        style={{ width: '5.5vh', height: '5.5vh', animation: 'spin 1.2s linear infinite' }} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="#2ecc71" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
      </svg>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  // Pantalla de carga dura inicial
  if (isLoading) {
    return (
      <div className="totem-container" style={{ backgroundColor: '#0A0E17' }}>
        <TransitionScreen />
      </div>
    );
  }

  // FASE 1: ORDEN = UF -> DÓLAR -> EURO -> IPSA
  const Screen1 = () => (
    <div className="screen-container">
      <Header title="DIVISAS & ÍNDICES" subtitle="INDICADORES ECONÓMICOS" />

      <div className="modern-card epic-enter delay-2">
        <div className="card-left">
          <div className="ticker-title">UF</div>
          <div className="ticker-desc">Unidad de Fomento</div>
        </div>
        <div className="vertical-divider"></div>
        <div className="card-right">
          <div className="price-value">{formatNumber(divisas.uf.price)}</div>
          {renderPill(divisas.uf.change)}
        </div>
      </div>

      <div className="modern-card border-green epic-enter delay-3">
        <div className="card-left">
          <div className="ticker-title">USD/CLP</div>
          <div className="ticker-desc">Dólar Observado</div>
        </div>
        <div className="vertical-divider"></div>
        <div className="card-right">
          <div className="price-value">{formatNumber(divisas.dolar.price)}</div>
          {renderPill(divisas.dolar.change)}
        </div>
      </div>

      <div className="modern-card epic-enter delay-4">
        <div className="card-left">
          <div className="ticker-title">EUR/CLP</div>
          <div className="ticker-desc">Euro</div>
        </div>
        <div className="vertical-divider"></div>
        <div className="card-right">
          <div className="price-value">{formatNumber(divisas.euro.price)}</div>
          {renderPill(divisas.euro.change)}
        </div>
      </div>

      <div className="modern-card border-orange epic-enter delay-5">
        <div className="card-left">
          <div className="ticker-title orange">IPSA</div>
          <div className="ticker-desc">S&P IPSA Index</div>
        </div>
        <div className="vertical-divider"></div>
        <div className="card-right">
          <div className="price-value">
            {formatNumber(divisas.ipsa.price, false)} Pts
          </div>
          {renderPill(divisas.ipsa.change)}
        </div>
      </div>

      <div className="footer-text-bottom">
        FUENTE: <span>API NEXAPP</span> / BCCH
      </div>
    </div>
  );

  // FASE 2: ACCIONES
  const Screen2 = () => (
    <div className="screen-container">
      <Header title="MERCADO LOCAL" subtitle="ACCIONES MÁS TRANSADAS" />

      {acciones.map((acc: any, index) => (
        <div
          className={`modern-card epic-enter delay-${index + 1}`}
          key={acc.id}
          style={{ marginBottom: '0.8vh' }}
        >
          <div className="card-left">
            <div className="ticker-title" style={{ fontSize: '2.8vh' }}>
              {acc.tickerVisual}
            </div>
            <div className="ticker-desc">{acc.nombre}</div>
          </div>
          <div className="vertical-divider" style={{ height: '4vh' }}></div>
          <div className="card-right">
            <div className="price-value" style={{ fontSize: '3vh' }}>
              {formatNumber(acc.price, true, acc.isCLP ? '$' : 'USD ')}
            </div>
            {renderPill(acc.change)}
          </div>
        </div>
      ))}
      <div className="footer-text-bottom">
        ACTUALIZACIÓN: <span>TIEMPO REAL</span>
      </div>
    </div>
  );

  // FASE 3: MARKETING 
  const Screen3 = () => (
    <div className="screen-container">
      <div className="epic-enter delay-1">
        <img
          src="/logo.png"
          alt="Logo"
          style={{ width: '18vh', margin: '0 auto', display: 'block' }}
        />
      </div>

      <div className="marketing-title epic-enter delay-2">
        ¿QUIERES APRENDER
        <br />
        DE <span className="marketing-highlight">FINANZAS</span>?
      </div>

      <div className="epic-chart-container epic-enter delay-3">
        <div className="epic-chart-box">
          <div className="animated-chart-line"></div>
        </div>
      </div>

      <div
        className="epic-enter delay-4"
        style={{ textAlign: 'center', marginTop: '4vh', width: '100%' }}
      >
        <div
          style={{
            color: '#8B95A5',
            fontSize: '1.5vh',
            fontWeight: 700,
            letterSpacing: '0.2vh',
          }}
        >
          VISÍTANOS EN
        </div>
        <div
          style={{
            color: '#ffffff',
            fontSize: '3.5vh',
            fontWeight: 800,
            fontFamily: 'Teko',
            marginTop: '0.5vh',
            letterSpacing: '0.1vh',
          }}
        >
          WWW.NEXAPP.CL
        </div>
      </div>
    </div>
  );

  return (
    <div className="totem-container" style={{ backgroundColor: activeScreen === 4 ? '#0A0E17' : '' }}>
      {/* Ocultamos la marca de agua en la fase de carga para que no choque */}
      {activeScreen !== 4 && <img src="/16.png" alt="Fondo" className="watermark" />}

      {activeScreen === 1 && <Screen1 />}
      {activeScreen === 2 && <Screen2 />}
      {activeScreen === 3 && <Screen3 />}
      {activeScreen === 4 && <TransitionScreen />}
    </div>
  );
}
