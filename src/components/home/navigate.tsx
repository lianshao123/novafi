import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Navigate() {
  return (
    <div>
      <header className="bg-[#0b0e14] w-screen flex justify-center">
        <nav className="flex h-[75px] items-center justify-between w-screen">
          <div className="flex items-center lg:ml-[50px] ml-2">
            <span className="font-extrabold text-2xl ml-2 text-[#75fba7]">
              NovaFi
            </span>
          </div>
          <div className="flex items-center font-bold text-xl lg:mr-[50px] mr-2">
            <ConnectButton showBalance={false} chainStatus="icon" />
          </div>
        </nav>
      </header>
    </div>
  );
}
