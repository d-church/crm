import { Input } from '@/components/ui';
import { cn } from '@/lib/utils';

import {
  getFilterField,
  getFilterOptions,
  getValueShape,
  type ConditionDraft,
  type FilterOptionSources,
} from './filter-fields';

type FilterValueInputProps = {
  draft: ConditionDraft;
  sources: FilterOptionSources;
  onChange: (patch: Partial<ConditionDraft>) => void;
};

/** The control follows the operator: a checklist, a date, a number of days, a range. */
export const FilterValueInput = ({ draft, sources, onChange }: FilterValueInputProps) => {
  const { label } = getFilterField(draft.field);
  const shape = getValueShape(draft.field, draft.operator);
  const [from, to] = draft.range;

  switch (shape) {
    case 'none':
      return null;

    case 'text':
      return (
        <Input
          value={draft.text}
          maxLength={100}
          placeholder="Значення"
          aria-label={`${label}: значення`}
          onChange={(event) => onChange({ text: event.target.value })}
        />
      );

    case 'date':
      return (
        <Input
          type="date"
          value={draft.text}
          aria-label={`${label}: дата`}
          onChange={(event) => onChange({ text: event.target.value })}
        />
      );

    case 'dateRange':
      return (
        <RangeInputs
          type="date"
          label={label}
          from={from}
          to={to}
          onChange={(range) => onChange({ range })}
        />
      );

    case 'number':
      return (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={draft.field === 'age' ? 130 : draft.field === 'birthday' ? 366 : 36500}
            value={draft.text}
            placeholder="0"
            aria-label={`${label}: ${draft.field === 'age' ? 'вік' : 'кількість днів'}`}
            className="w-24"
            onChange={(event) => onChange({ text: event.target.value })}
          />
          <span className="text-ink-soft text-[12.5px]">
            {draft.field === 'age' ? 'років' : 'днів'}
          </span>
        </div>
      );

    case 'numberRange':
      return (
        <RangeInputs
          type="number"
          label={label}
          from={from}
          to={to}
          onChange={(range) => onChange({ range })}
        />
      );

    case 'list':
    case 'monthList':
      return (
        <OptionChecklist
          label={label}
          options={getFilterOptions(draft.field, sources)}
          selected={draft.list}
          onChange={(list) => onChange({ list })}
        />
      );
  }
};

type RangeInputsProps = {
  type: 'date' | 'number';
  label: string;
  from: string;
  to: string;
  onChange: (range: [string, string]) => void;
};

const RangeInputs = ({ type, label, from, to, onChange }: RangeInputsProps) => {
  const isNumber = type === 'number';
  const isReversed = from !== '' && to !== '' && (isNumber ? Number(from) > Number(to) : from > to);

  return (
    <div className="grid gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type={type}
          inputMode={isNumber ? 'numeric' : undefined}
          min={isNumber ? 0 : undefined}
          value={from}
          placeholder={isNumber ? 'від' : undefined}
          aria-label={`${label}: від`}
          aria-invalid={isReversed}
          className={cn(isNumber ? 'w-20' : 'w-auto min-w-0 flex-1')}
          onChange={(event) => onChange([event.target.value, to])}
        />
        <span className="text-muted-foreground">—</span>
        <Input
          type={type}
          inputMode={isNumber ? 'numeric' : undefined}
          min={isNumber ? 0 : undefined}
          value={to}
          placeholder={isNumber ? 'до' : undefined}
          aria-label={`${label}: до`}
          aria-invalid={isReversed}
          className={cn(isNumber ? 'w-20' : 'w-auto min-w-0 flex-1')}
          onChange={(event) => onChange([from, event.target.value])}
        />
        {isNumber ? <span className="text-ink-soft text-[12.5px]">років</span> : null}
      </div>
      {isReversed ? (
        <p className="text-destructive text-[11.5px]">Початок не може бути пізніше за кінець</p>
      ) : null}
    </div>
  );
};

type OptionChecklistProps = {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
};

/** Checkboxes rather than a multi-select: they read the same on a phone and a desktop. */
const OptionChecklist = ({ label, options, selected, onChange }: OptionChecklistProps) => {
  if (options.length === 0) {
    return <p className="text-ink-faint py-2 text-[12.5px]">Немає значень для вибору</p>;
  }

  const toggle = (value: string) =>
    onChange(
      selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value],
    );

  return (
    <fieldset className="grid gap-1">
      <legend className="sr-only">{label}</legend>
      <div className="border-input-border bg-input grid max-h-44 gap-0.5 overflow-y-auto rounded-md border p-1 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="hover:bg-accent flex min-h-8 cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-[13px] transition-colors"
          >
            <input
              type="checkbox"
              className="accent-primary size-3.5 shrink-0"
              checked={selected.includes(option.value)}
              onChange={() => toggle(option.value)}
            />
            <span className="min-w-0 truncate">{option.label}</span>
          </label>
        ))}
      </div>
      {selected.length > 0 ? (
        <p className="text-ink-faint text-[11.5px]">Обрано: {selected.length}</p>
      ) : null}
    </fieldset>
  );
};
