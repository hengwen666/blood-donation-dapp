git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/hengwen666/blood-donation-dapp 献血去中心化应用程序
/App.js.git
git push -u origin main
import React, { useState, useEffect } from 'react';
import detectEthereumProvider from '@metamask/detect-provider';
import Web3 from 'web3';
import bloodDonationABI from './abi/BloodDonationCreditABI.json'; 

// Contract deployment address (replace with actual address)
const CONTRACT_ADDRESS = '0xYourDeployedContractAddress';

const App = () => {
  // Wallet state
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    bloodType: '',
    donationType: '',
    bloodAmount: 0
  });

  // Interaction state
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Initialize connection detection
  useEffect(() => {
    const checkConnection = async () => {
      const provider = await detectEthereumProvider();
      if (provider) {
        // Listen for account changes
        provider.on('accountsChanged', (accounts) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setIsConnected(true);
            setConnectionError('');
          } else {
            setAccount(null);
            setIsConnected(false);
            setConnectionError('Wallet disconnected');
          }
        });

        // Listen for chain changes
        provider.on('chainChanged', () => {
          window.location.reload(); 
        });

        // Check existing accounts
        const accounts = await provider.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await initializeWeb3(provider);
          setAccount(accounts[0]);
          setIsConnected(true);
        }
      } else {
        setConnectionError('Please install MetaMask wallet');
      }
    };

    checkConnection();
  }, []);

  // Initialize Web3 and contract
  const initializeWeb3 = async (provider) => {
    const web3Instance = new Web3(provider);
    setWeb3(web3Instance);
    
    const contractInstance = new web3Instance.eth.Contract(
      bloodDonationABI,
      CONTRACT_ADDRESS
    );
    setContract(contractInstance);
  };

  // Connect wallet
  const connectWallet = async () => {
    try {
      setConnectionError('');
      const provider = await detectEthereumProvider();
      if (!provider) {
        setConnectionError('MetaMask not detected');
        return;
      }

      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      if (accounts.length === 0) {
        setConnectionError('Please authorize account access');
        return;
      }

      await initializeWeb3(provider);
      setAccount(accounts[0]);
      setIsConnected(true);
      setMessage('Wallet connected successfully');
    } catch (error) {
      setConnectionError(`Connection failed: ${error.message}`);
      console.error('Wallet error:', error);
    }
  };

  // Handle form input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Submit registration
  const handleRegister = async () => {
    if (!formData.name || !formData.bloodType || !formData.donationType || formData.bloodAmount <= 0) {
      setMessage('Please fill in complete information');
      return;
    }

    if (!isConnected || !contract) {
      setMessage('Please connect wallet first');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const tx = await contract.methods
        .registerDonor(
          account,
          formData.name,
          formData.bloodType,
          formData.donationType,
          formData.bloodAmount
        )
        .send({ from: account });

      const event = tx.events.DonorRegistered;
      if (event) {
        setMessage(`Registration successful! Points: ${event.returnValues.points}`);
        setFormData({ name: '', bloodType: '', donationType: '', bloodAmount: 0 });
      } else {
        setMessage('Waiting for blockchain confirmation...');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setMessage(`Registration failed: ${error.message.includes('User rejected') ? 'Transaction rejected' : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' }}>
      <h1 style={{ textAlign: 'center', color: '#2c3e50' }}>Blockchain Blood Donation Credit System</h1>

      {/* Wallet Connection */}
      <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3>Wallet Status</h3>
        {isConnected ? (
          <p style={{ color: 'green' }}>
            Connected: {account.slice(0, 6)}...{account.slice(-4)}
          </p>
        ) : (
          <button
            onClick={connectWallet}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Connect MetaMask Wallet
          </button>
        )}
        {connectionError && (
          <p style={{ color: 'red', marginTop: '10px' }}>{connectionError}</p>
        )}
      </div>

      {/* Donor Registration Form */}
      <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#34495e' }}>Donor Registration</h2>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            placeholder="Enter your name"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Blood Type:</label>
          <select
            name="bloodType"
            value={formData.bloodType}
            onChange={handleInputChange}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="">Select blood type</option>
            <option value="A">Type A</option>
            <option value="B">Type B</option>
            <option value="AB">Type AB</option>
            <option value="O">Type O</option>
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Donation Type:</label>
          <input
            type="text"
            name="donationType"
            value={formData.donationType}
            onChange={handleInputChange}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            placeholder="e.g. Whole Blood, Platelets"
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Donation Amount (ml):</label>
          <input
            type="number"
            name="bloodAmount"
            value={formData.bloodAmount}
            onChange={handleInputChange}
            min="100"
            step="50"
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            placeholder="Enter donation amount"
          />
        </div>

        <button
          onClick={handleRegister}
          disabled={isLoading || !isConnected}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: isConnected ? '#2ecc71' : '#bdc3c7',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isConnected ? 'pointer' : 'not-allowed',
            fontSize: '16px'
          }}
        >
          {isLoading ? 'Submitting...' : 'Submit Registration'}
        </button>

        {message && (
          <p style={{ 
            marginTop: '15px', 
            padding: '10px', 
            borderRadius: '4px',
            backgroundColor: message.includes('success') ? '#eafaf1' : '#fdedeb',
            color: message.includes('success') ? '#27ae60' : '#e74c3c'
          }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default App;


