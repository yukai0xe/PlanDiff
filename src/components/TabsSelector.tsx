import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';

interface TabsSelectorProps {
    tabs: string[];
    activeTab: number;
    setActiveTab: React.Dispatch<React.SetStateAction<number>>
}

const TabsSelector = ({tabs, activeTab, setActiveTab}: TabsSelectorProps) => {
    return (
        <div className='flex gap-x-2'>
            {tabs.length < 5 ? (
                tabs.map((tab, idx) => (
                    <button
                    key={idx}
                    onClick={() => setActiveTab(idx)}
                    className={`px-4 py-2 rounded-2xl text-sm font-medium transition
                    ${activeTab === idx
                        ? "bg-blue-500 text-white shadow"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                    {tab}
                    </button>
                )
                )
            ) : (
                <Listbox value={activeTab} onChange={setActiveTab}>
                    <div className="relative">
                            <ListboxButton className="w-40 px-3 py-2 border rounded-lg bg-blue-500 shadow-sm text-white text-sm font-bold">
                            {tabs[activeTab]}
                        </ListboxButton>
                        <ListboxOptions className="absolute mt-1 max-h-60 w-40 overflow-auto rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none text-sm z-50">
                            {tabs.map((tab, idx) => (
                                <ListboxOption
                                    key={idx}
                                    value={idx}
                                    className={({ active }) =>
                                        `cursor-pointer select-none px-3 py-2 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-700'
                                        }`
                                    }
                                >
                                    {tab}
                                </ListboxOption>
                            ))}
                        </ListboxOptions>
                    </div>
                </Listbox>
            )}
        </div>
    )
}

export default TabsSelector;