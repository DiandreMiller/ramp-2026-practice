import { useEffect, useMemo, useState } from 'react';
import transactions from '../api/transactions';

interface Transaction {
  id: number;
  merchant: string;
  amount: number;
  category: string;
  date: string;
}

const TransactionsPage = () => {
  const [transactionsList, setTransactionsList] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchMerchant, setSearchMerchant] = useState<string>('');
  const [debounceSearch, setDebounceSearch] = useState<string>(searchMerchant);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const { data } = await new Promise<{
          data: Transaction[];
          status: number;
          statusText: string;
        }>((resolve) => {
          setTimeout(() => {
            resolve({
              data: transactions,
              status: 200,
              statusText: 'OK',
            });
          }, 500);
        });

        const normalize = Array.isArray(data) ? data : [];
        setTransactionsList(normalize);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load transactions');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = ['All', ...new Set(transactionsList.map((transaction) => transaction.category))];
    return uniqueCategories;
  }, [transactionsList]);

  const filteredByCategory = useMemo(() => {
    if (selectedCategory === 'All') {
      return transactionsList;
    } else {
      return transactionsList.filter((transaction) => transaction.category === selectedCategory);
    }
  }, [selectedCategory, transactionsList]);

  const filteredTransactions = useMemo(() => {
    if (!debounceSearch.trim()) {
      return filteredByCategory;
    }
    
    const searchTerm = debounceSearch.toLowerCase().trim();
    return filteredByCategory.filter((transaction) =>
      transaction.merchant.toLowerCase().includes(searchTerm)
    );
  }, [filteredByCategory, debounceSearch]);

  const totalAmount = useMemo(() => {
    return filteredTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  }, [filteredTransactions]);

  const categoryTotal = useMemo(() => {
    return filteredByCategory.reduce((sum, transaction) => sum + transaction.amount, 0);
  }, [filteredByCategory]);

  // Debounce Search Query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounceSearch(searchMerchant)
    }, 400);

    return () => clearTimeout(timer)
  }, [searchMerchant])

  return (
    <div>
      <h1>Transactions</h1>

      <div style={{ marginBottom: '20px' }}>
        <label htmlFor='merchant-search' style={{ marginRight: '10px', fontWeight: 'bold' }}>
          Search Merchant:
        </label>
        <input
          id='merchant-search'
          type='text'
          placeholder='Search by merchant name...'
          value={searchMerchant}
          onChange={(e) => setSearchMerchant(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            fontSize: '14px',
            width: '250px'
          }}
        />
      </div>

      {/* Category Filter */}
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor='category' style={{ marginRight: '10px', fontWeight: 'bold' }}>
          Filter by Category
        </label>
        <select
          id='category'
          value={selectedCategory}
          onChange={(event) => setSelectedCategory(event.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            fontSize: '14px'
          }}  
        >
          {categories.map((category) => 
            <option key={category} value={category}>
              {category}
            </option>
          )}
        </select>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && !error && (
        <div>

          <div style={{
            padding: '15px',
            marginBottom: '20px',
            backgroundColor: '#f0f9ff',
            borderRadius: '8px',
            border: '1px solid #bae6fd'
          }}>
            <h3 style={{ margin: '0 0 10px 0' }}>Summary</h3>
            <p style={{ margin: '5px 0' }}>
              <strong>Showing:</strong> {filteredTransactions.length} of {transactionsList.length} transactions
            </p>
            <p style={{ margin: '5px 0' }}>
              <strong>Total Amount:</strong> ${totalAmount.toFixed(2)}
            </p>
            {selectedCategory !== 'All' && (
              <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                Category total: ${categoryTotal.toFixed(2)} in {selectedCategory}
              </p>
            )}
            {debounceSearch && (
              <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                Search results for: "{debounceSearch}"
              </p>
            )}
          </div>

          <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
            <strong>💰 Grand Total (all transactions):</strong> $
            {transactionsList.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
          </div>
          
          <ul>
            {filteredTransactions.map((transaction) => (
              <li key={transaction.id}>
                {transaction.merchant} - ${transaction.amount} - {transaction.category} - {transaction.date}
              </li>
            ))}
          </ul>

          {filteredTransactions.length === 0 && (
            <p>
              No transactions found 
              {debounceSearch && ` matching "${debounceSearch}"`}
              {selectedCategory !== 'All' && ` in ${selectedCategory} category`}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;