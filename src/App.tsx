import React from 'react';
import './App.css'
import {createBrowserRouter, Outlet, redirect, RouteObject, RouterProvider} from "react-router-dom";
import zhCN from 'antd/locale/zh_CN';
import {ConfigProvider} from "antd";
import './styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from './config/wagmi';


const Home = React.lazy(() => import("./pages/home"));

export const baseRouterName = "novafi";
export const routerMap: RouteObject[] = [
    {
        index: true,
        loader: async () => {
            return redirect("/novafi/home");
        },
        errorElement: <div>404</div>,
    },
    {
        path: baseRouterName,
        element: <Outlet />,
        children: [
            {
                path: '',
                element: <React.Suspense fallback={<>...</>}><Outlet /></React.Suspense>,
                errorElement: <div>404</div>,
                children: [
                    {
                        index: true,
                        element: <React.Suspense fallback={<>...</>}><Home /></React.Suspense>,
                    },
                    {
                        path: "home",
                        element: <React.Suspense fallback={<>...</>}><Home /></React.Suspense>,
                    }
                ]
            },
        ]
    }
];

const client = new QueryClient();

function App() {
    const router = createBrowserRouter(routerMap);
    return <ConfigProvider locale={ zhCN }>
            {/* <Navigate/> */}
            <WagmiProvider config={config}>
             <QueryClientProvider client={client}>
                <RainbowKitProvider>
                  <RouterProvider router={ router } />
                </RainbowKitProvider>
              </QueryClientProvider>
            </WagmiProvider>
           </ConfigProvider>
}

export default App
