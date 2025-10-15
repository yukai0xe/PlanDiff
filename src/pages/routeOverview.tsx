import RouteInfoDialog from "@/components/RouteInfoDialog";
import FunctionalDialog from "@/components/FunctionalDialog";
import TabsSelector from "@/components/TabsSelector";
import Selector from "@/components/Selector";
import RouteTable from "@/components/Table";
import { numberToChinese } from "@/lib/utility";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRouteStore } from "@/store/routeStore";
import { getEmptyDateRoute, routeDataMapping } from "@/data/routeData";
import { v7 as uuidv7 } from "uuid";
import dayjs from "dayjs";

const RoutePlanPage = () => {
  const { setRoutes, routes} = useRouteStore();
  const [tabs, setTabs] = useState(["預計行程"]);
  const [activeTab, setActiveTab] = useState<number>(0);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const saveHandler = (arrive: string, depart: string, teamSize: string, weather: string, source: string) => {
    const newRoutes = routes.map((route) => {
      const newRoute: Route = { ...route, days: {} };
      for (const date in route.days) {
        newRoute.days[date] = route.days[date].map((r) => ({ ...r }));
      }
      return newRoute;
    });
    saveTime(newRoutes, { tempArrival: arrive, tempDeparture: depart });
    saveInfo(newRoutes, { teamSize, weather, source });
    setRoutes(newRoutes);
    closeModal();
  }
  
  const saveTime = (
    newRoutes: Route[],
    {
      tempArrival,
      tempDeparture
    }: {
      tempArrival: string;
      tempDeparture: string;
    }
  ) => {
    const diffTime =
      new Date(tempArrival).getTime() - new Date(tempDeparture).getTime();
    if (diffTime < 0) return;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    let currentDate = tempDeparture;
    if (activeTab === routes.length) {
      newRoutes.push({
        id: uuidv7(),
        source: "",
        teamSize: 1,
        weather: "",
        days: {},
      });
      for (let i = 0; i < diffDays; i++) {
        newRoutes[activeTab].days[currentDate] = getEmptyDateRoute();
        const dateObj = new Date(currentDate);
        dateObj.setDate(dateObj.getDate() + 1);
        currentDate = dateObj.toISOString().split("T")[0];
      }
    } else {
      newRoutes[activeTab] = {
        id: uuidv7(),
        source: "",
        teamSize: 1,
        weather: "",
        days: {},
      };

      const oldRecords = Object.values(routes[activeTab].days);
      for (let i = 0; i < diffDays; i++) {
        if (i > oldRecords.length - 1) newRoutes[activeTab].days[currentDate] = getEmptyDateRoute();
        else newRoutes[activeTab].days[currentDate] = oldRecords[i].map((r) => ({ ...r }));
        const dateObj = new Date(currentDate);
        dateObj.setDate(dateObj.getDate() + 1);
        currentDate = dateObj.toISOString().split("T")[0];
      }
    }
  };
  
  const saveInfo = (newRoutes: Route[], {teamSize, weather, source }: {
    teamSize: string,
    weather: string,
    source: string
  }) => {
    if (activeTab < routes.length) {
      newRoutes[activeTab].teamSize = Number(teamSize);
      newRoutes[activeTab].weather = weather;
      newRoutes[activeTab].source = source;
    }
    setRoutes(newRoutes);
  }

  const cancelHandler = () => {
    if(activeTab === routes.length) setActiveTab(0);
    setIsModalOpen(false);
  }
  
  const handleAddRoute = () => {
    setActiveTab(tabs.length);
    openModal();
  }
  
  const handleDeleteRoute = () => {
    if (activeTab === 0) return;
    const newData = routes.filter((_, idx) => idx !== activeTab);
    setRoutes(newData);
    if (activeTab >= newData.length) setActiveTab(newData.length - 1);
  }

  const loadExampleData = (route: string) => {
    const load = async (key: string) => {
      const module = await import(`../data/${key}.json`);
      return module?.default ?? module;
    }
    load(routeDataMapping[route])
      .then(data => setRoutes(data))
  }

  useEffect(() => {
    if (routes.length > 0) {
      const newTabs = ["預計行程"];
      for (let i = 1; i < routes.length; i++)
        newTabs.push("參考行程" + numberToChinese(i));
      setTabs(newTabs);
    }
  }, [routes]);

    const renderDialog = () => {
        if (activeTab >= routes.length) {
          return (
            <RouteInfoDialog
              currentDepart={dayjs().format("YYYY-MM-DD")}
              currentArrive={dayjs().format("YYYY-MM-DD")}
              currentTeamSize={"1"}
              currentWeather={""}
              currentSource={""}
              confirmHandler={(arrive, depart, teamSize, weather, source) => saveHandler(arrive, depart, teamSize, weather, source)}
              cancelHandler={() => cancelHandler()}
            />
          );
        } else {
          const dates = Object.keys(routes[activeTab].days);
          const { teamSize, weather, source } = routes[activeTab];
          return (
            <RouteInfoDialog
              currentDepart={dates[0]}
              currentArrive={dates[dates.length - 1]}
              currentTeamSize={teamSize.toString()}
              currentWeather={activeTab !== 0 ? weather : undefined}
              currentSource={activeTab !== 0 ? source : undefined}
              confirmHandler={(arrive, depart, teamSize, weather, source) => saveHandler(arrive, depart, teamSize, weather, source)}
              cancelHandler={() => cancelHandler()}
            />
          );
        }
    }

    return (
    <div className="min-h-screen w-full bg-gradient-to-b from-gray-50 to-white p-6 shadow-2xl">
        {/* Tab 切換列 */}
        <div className="flex pb-4 justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => openModal()}
              className="px-6 py-2 rounded-2xl bg-yellow-400 text-stone-700 hover:bg-yellow-500 text-sm"
            >
              修改隊伍資訊/修改日期
            </button>
            <TabsSelector activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} />
            <button
              onClick={() => handleAddRoute()}
              className="px-4 py-2 rounded-2xl bg-green-100 text-green-700 hover:bg-green-200 text-sm"
            >
              + 新增參考行程
            </button>
          </div>
          <div className="flex gap-x-2 items-center">
            <Selector tabs={Object.keys(routeDataMapping)} label={"載入範例行程"} onChange={loadExampleData} />
            <button
              className="px-4 py-2 rounded bg-amber-200 text-gray-800 hover:bg-amber-300"
              onClick={() => navigate("/mapping")}
            >
              行程比較
            </button>
            {activeTab !== 0 && (
              <button
                className="px-4 py-2 rounded bg-red-500 text-gray-50 hover:bg-red-600 transition"
                onClick={() => handleDeleteRoute()}
              >
                刪除行程
              </button>
            )}
            <FunctionalDialog />
          </div>
        </div>
        {activeTab < routes.length && (
          <ul className="mb-2 flex flex-col gap-y-1">
            <li>隊伍人數：{routes[activeTab].teamSize}</li>
            {activeTab !== 0 && (
              <>
                <li>天氣：{routes[activeTab].weather}</li>
                <li>資料來源：<a className="inline-block text-blue-600 underline hover:text-blue-800"
                  href={routes[activeTab].source}>{routes[activeTab].source}</a></li>
              </>
            )}
          </ul>
        )}

        <div className="text-xs text-gray-500">
          提示：每份行程要比較的紀錄點要盡量相同，不然無法成功比較（ex: 道路交界處統一是岔路口或登山口）
        </div>

        {/* 表格內容 */}
        <div className="w-full px-10">
          <RouteTable data={routes} setData={setRoutes} activeTab={activeTab} />
        </div>
        {/* Modal */}
        {isModalOpen && renderDialog()}
      </div>
    );
};

export default RoutePlanPage;
