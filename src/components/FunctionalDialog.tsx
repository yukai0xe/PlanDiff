
import { HiEllipsisHorizontal } from "react-icons/hi2";
import { FaFileInvoice } from "react-icons/fa";
import { FaFileImport } from "react-icons/fa6";
import { useState, useRef, useEffect } from "react";
import { useRouteStore } from "@/store/routeStore";
import generateDocument from "@/lib/document";
import { Packer } from "docx";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";

const FunctionalDialog = () => {
    const [showBtn, setShowBtn] = useState(false);
    const { setRoutes, setRoutesMapping, routes, routesCompare, routesMapping } = useRouteStore();
    
    const exportBackup = () => {
        const json = JSON.stringify({ routes, routesMapping } , null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "routes.json";
        a.click();
        URL.revokeObjectURL(url);
    }
    
    const importBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
        try {
            const text = event.target?.result as string;
            const json: {routes: Route[], routesMapping: RoutesMapping} = JSON.parse(text);
            if (json.routes) {
                setRoutes(json.routes);
                setRoutesMapping(json.routesMapping);
                toast.success("匯入成功");
            } else {
                toast.error("格式錯誤");
            }
        } catch (err) {
            if (err instanceof Error) toast.error("讀取或解析失敗：" + err.message);
            else toast.error("讀取或解析失敗：未知錯誤");
        } finally {
            setShowBtn(false);
        }
        };
        reader.readAsText(file);
    };
    
    const handleDownload = async () => {
        const doc = generateDocument(routes, routesCompare);
        const blob = await Packer.toBlob(doc);
        saveAs(blob, "參考行程.docx");
    };

    const popupRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        function handleMouseDownOutside(e: MouseEvent) {
            if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
                setShowBtn(false);
            }
        }
        document.addEventListener("mousedown", handleMouseDownOutside);
        return () => document.removeEventListener("mousedown", handleMouseDownOutside);
    }, []);
    
    return (
        <div className="relative" ref={popupRef}>
            <HiEllipsisHorizontal
                className={`size-8 cursor-pointer hover:bg-gray-100 rounded ${showBtn && "bg-gray-200"
                    }`}
                onClick={() => setShowBtn(!showBtn)}
            />
            {showBtn && (
                <div className="absolute z-50 top-10 right-0 flex flex-col gap-2 text-left w-64 bg-white rounded shadow-2xl">
                    <label className="inline-flex items-center gap-x-2 text-left hover:bg-gray-100 text-gray-800 px-4 py-3 transition cursor-pointer">
                        <FaFileImport className="size-6 hover:text-slate-700 transition" />
                        匯入備份檔
                        <input
                            type="file"
                            accept=".json"
                            onChange={importBackup}
                            className="hidden"
                        />
                    </label>
                    <button
                        className="inline-flex items-center gap-x-2 text-left hover:bg-gray-100 text-gray-800 px-4 py-3 transition"
                        onClick={exportBackup}
                    >
                        <FaFileInvoice className="size-6 hover:text-slate-700 transition" />
                        匯出備份檔
                    </button>
                    <button
                        className="inline-flex items-center gap-x-2 text-left hover:bg-gray-100 text-gray-800 px-4 py-3 transition"
                        onClick={handleDownload}
                    >
                        <FaFileInvoice className="size-6 hover:text-slate-700 transition" />
                        匯出文件(docx)
                    </button>
                </div>
            )}
        </div>
    )
}

export default FunctionalDialog;
