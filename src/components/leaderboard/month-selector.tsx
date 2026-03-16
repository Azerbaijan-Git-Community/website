"use client";

import { useQueryState } from "nuqs";
import { ListBox, Select } from "@heroui/react";
import { use } from "react";
import { PiCaretUpDownBold } from "react-icons/pi";

function formatMonthKey(key: string): string {
  const [year, month] = key.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleString("en", {
    month: "long",
    year: "numeric",
  });
}

type MonthSelectorProps = {
  availableMonthsPromise: Promise<string[]>;
  currentMonthKey: string;
};

export function MonthSelector({ availableMonthsPromise, currentMonthKey }: MonthSelectorProps) {
  const months = use(availableMonthsPromise);
  const [month, setMonth] = useQueryState("month", {
    defaultValue: currentMonthKey,
    shallow: true,
  });

  return (
    <div className="mx-auto max-w-xs">
      <Select value={month} onChange={(key) => setMonth(key as string)} className="w-full">
        <Select.Trigger className="glass w-full rounded-lg px-4 py-3 font-outfit text-base font-semibold text-hi transition-all hover:border-blue focus:ring-2 focus:ring-blue focus:outline-none">
          <Select.Value />
          <Select.Indicator className="size-4 text-lo">
            <PiCaretUpDownBold />
          </Select.Indicator>
        </Select.Trigger>
        <Select.Popover
          placement="top"
          className="glass rounded-lg border border-line shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
        >
          <ListBox className="p-1">
            {months.map((m) => (
              <ListBox.Item
                key={m}
                id={m}
                textValue={formatMonthKey(m)}
                className="cursor-pointer rounded-md px-4 py-2 font-outfit font-medium text-hi transition-colors hover:bg-overlay focus:bg-overlay focus:outline-none"
              >
                {formatMonthKey(m)}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
    </div>
  );
}
