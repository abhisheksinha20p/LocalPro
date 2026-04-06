import { View, Text, TextInput, Button } from 'react-native';

export default function Login() {
  return (
    <View>
      <Text>Welcome to LocalPro</Text>
      <Text>Enter your phone number</Text>
      <TextInput placeholder="+91 98765 43210" />
      <Button title="Send OTP" onPress={() => {}} />
    </View>
  );
}
