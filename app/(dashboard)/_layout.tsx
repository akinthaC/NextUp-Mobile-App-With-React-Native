import React from 'react';
import { Tabs } from 'expo-router/tabs';
import Entypo from '@expo/vector-icons/Entypo';

type EntypoIconName = "home" | "clipboard" | "user" | "cog";

const tabs: { label: string; name: string; icon: EntypoIconName }[] = [
  { label: "Home", name: "home", icon: "home" },
  { label: "Tasks", name: "task", icon: "clipboard" },
  { label: "Profile", name: "profile", icon: "user" },
  { label: "Settings", name: "setting", icon: "cog" }
];

const DashboardLayout = () => {
  return (
    <Tabs>
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name} // ✅ Unique key here
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ color, size }) => (
              <Entypo name={tab.icon} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
};

export default DashboardLayout;
