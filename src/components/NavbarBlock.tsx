import { IoGitCompareSharp } from "react-icons/io5";
import { FaRoute } from "react-icons/fa6";
import { PiTableFill } from "react-icons/pi";
import { NavLink } from "react-router-dom";

export default function NavBarBlock() {
    const tabs = [
        { to: "/", icon: <FaRoute  size={25}/>, label: "詳細行程內容"},
        { to: "/mapping", icon: <IoGitCompareSharp size={25} />, label: "行程資料連結" },
        { to: "/compare", icon: <PiTableFill size={25} />, label: "行程比較表" },
    ];

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex justify-around w-[90%] max-w-md bg-white/80 backdrop-blur-lg border border-gray-200 rounded-2xl shadow-lg px-4 py-2 z-50">
            {tabs.map((tab) => (
                <NavLink
                    key={tab.to}
                    to={tab.to}
                    title={tab.label}
                    end
                    className={({ isActive }) =>
                        `flex flex-col items-center transition-transform duration-200 ${isActive
                            ? "text-blue-600 scale-110"
                            : "text-gray-500 hover:text-blue-400"
                        }`
                    }
                >
                    {tab.icon}
                </NavLink>
            ))}
        </div>
    );
}