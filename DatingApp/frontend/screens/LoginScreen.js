import React, { useState } from 'react';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    // azurite function for login
    return TextTrackCueList;
  }
  return (
    <div>
      <input type="text" placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
      <button onClick={handleLogin}>Login</button>
      <button title="Go to Register" onPress={() => navigation.navigate('Register')}/>
    </div>
  );
}
