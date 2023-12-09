import React, { createContext, useContext, useState, useEffect } from 'react';
import Web3 from 'web3';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [connected, setConnected] = useState(false);

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });

        if (accounts.length > 0) {
          const address = accounts[0];
          setWalletAddress(address);
          setConnected(true);
        } else {
          console.error('No se seleccionó ninguna cuenta en MetaMask.');
          setWalletAddress(null);
          setConnected(false);
        }
      } else {
        console.error('MetaMask no está instalado.');
        setWalletAddress(null);
        setConnected(false);
      }
    } catch (error) {
      console.error('Error en connectWallet:', error);
      setWalletAddress(null);
      setConnected(false);
    }
  };

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        setConnected(accounts.length > 0);
        setWalletAddress(accounts.length > 0 ? accounts[0] : null);
      } catch (error) {
        console.error('Error al verificar la conexión:', error);
        setConnected(false);
        setWalletAddress(null);
      }
    };

    // Verificar la conexión al cargar la aplicación
    checkConnection();

    // Suscribirse a cambios de cuenta
    const handleAccountsChanged = function (accounts) {
      checkConnection();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, []);

  return (
    <WalletContext.Provider value={{ walletAddress, connected, connectWallet }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet debe usarse dentro de un WalletProvider');
  }
  return context;
};
