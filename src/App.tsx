import React, { useState, useEffect } from 'react';
import './index.css';

export default function App() {
  const [activeScreen, setActiveScreen] = useState(1);

  const [divisas, setDivisas] = useState({
    uf: { price: '', change: 0 },
    dolar: { price: '', change: 0 },
    euro: { price: '', change: 0 },
    ipsa: { price: '', change: 0 },
  });

  const [acciones, setAcciones] = useState<any[]>([]);

  // ================= 1. CARRUSEL DE 3 FASES =================
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveScreen((prev) => {
        if (prev === 1) return 2;
        if (prev === 2) return 3;
        return 1;
      });
    }, 10000); // 10 segundos por fase
    return () => clearInterval(interval);
  }, []);

  // ================= 2. CONSUMO DE DATOS =================
  useEffect(() => {
    const fetchAllData = async () => {
      const nuevasDivisas = { ...divisas };

      // OBTENER UF (Desde Mindicador)
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

      // OBTENER DÓLAR, EURO E IPSA
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
      setDivisas(nuevasDivisas);

      // OBTENER ACCIONES
      const diccionarioEmpresas: Record<string, any> = {
        'SQM-B.SN': { tickerVisual: 'SQM-B', nombre: 'Química Minera' },
        'VAPORES.SN': { tickerVisual: 'VAPORES', nombre: 'CSAV' },
        'CHILE.SN': { tickerVisual: 'CHILE', nombre: 'Banco de Chile' },
        'CENCOSUD.SN': { tickerVisual: 'CENCOSUD', nombre: 'Cencosud S.A.' },
        NVDA: { tickerVisual: 'NVDA', nombre: 'NVIDIA (USD)' },
      };

      const topDelMes = [
        'SQM-B.SN',
        'VAPORES.SN',
        'CHILE.SN',
        'CENCOSUD.SN',
        'NVDA',
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
              isCLP: !ticker.includes('NVDA'),
            });
          }
        } catch (error) {
          console.error(`Error Acción:`, error);
        }
      }
      setAcciones(nuevasAcciones);
    };
    fetchAllData();
  }, []);

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

  // FASE 3: MARKETING (Texto URL ajustado y centrado)
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
    <div className="totem-container">
      <img src="/16.png" alt="Fondo" className="watermark" />

      {activeScreen === 1 && <Screen1 />}
      {activeScreen === 2 && <Screen2 />}
      {activeScreen === 3 && <Screen3 />}
    </div>
  );
}
