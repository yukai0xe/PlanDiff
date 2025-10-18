import React, { useState } from 'react';

const RouteInfoDialog: React.FC<{
    currentArrive?: string
    currentDepart?: string
    currentTeamSize?: string
    currentWeather?: string
    currentSource?: string
    confirmHandler: (arrive: string, depart: string, teamSize: string, weather: string, source: string) => void;
    cancelHandler: () => void;
}> = ({
    currentArrive,
    currentDepart,
    currentTeamSize,
    currentWeather,
    currentSource,
    confirmHandler,
    cancelHandler
}) => {
    const [tempDeparture, setTempDeparture] = useState(currentDepart || "");
    const [tempArrival, setTempArrival] = useState(currentArrive || "");
    const [teamSize, setTeamSize] = useState(currentTeamSize || "1");
    const [weather, setWeather] = useState(currentWeather || "晴");
    const [source, setSource] = useState(currentSource || "");
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
            <div className="bg-white rounded-lg p-6 w-80 shadow-lg">
                <h2 className="text-lg font-bold mb-4">修改隊伍資訊/修改日期</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">開始日期</label>
                        <input
                            type="date"
                            value={tempDeparture}
                            onChange={(e) => setTempDeparture(e.target.value)}
                            className="w-full border rounded px-2 py-1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">結束日期</label>
                        <input
                            type="date"
                            value={tempArrival}
                            onChange={(e) => setTempArrival(e.target.value)}
                            className="w-full border rounded px-2 py-1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">隊伍人數</label>
                        <input
                            type="text"
                            value={teamSize}
                            onChange={(e) => setTeamSize(e.target.value)}
                            className="w-full border rounded px-2 py-1"
                        />
                    </div>
                    {
                        <>
                            <div>
                                <label className="block text-sm font-medium">天氣</label>
                                <input
                                    type="text"
                                    value={weather}
                                    onChange={(e) => setWeather(e.target.value)}
                                    className="w-full border rounded px-2 py-1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">資料來源</label>
                                <input
                                    type="text"
                                    value={source}
                                    placeholder="https://"
                                    onChange={(e) => setSource(e.target.value)}
                                    className="w-full border rounded px-2 py-1"
                                />
                            </div>
                        </>
                    }
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                    <button
                        onClick={() => cancelHandler()}
                        className="px-3 py-1 rounded border"
                    >
                        取消
                    </button>
                    <button
                        onClick={() => {
                            confirmHandler(tempArrival, tempDeparture, teamSize, weather, source)
                        }}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        儲存
                    </button>
                </div>
            </div>
        </div>
    );
}

export default RouteInfoDialog;