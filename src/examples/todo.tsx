import { h, createSignal, For } from "../rwr";

import "./todo.css";

interface TodoItem {
    key: string;
    done: () => boolean;
    label: string;
    setDone: (b: boolean) => void;
    edit: () => boolean;
    setEdit: (b: boolean) => void;
}

let currentKey = 0;

function nextKey() {
    currentKey++;
    return `todo-${currentKey}`;
}

function createItem(label: string, completed = false): TodoItem {
    const [done, setDone] = createSignal(completed);
    const [edit, setEdit] = createSignal(false);

    return {
        key: nextKey(),
        label,
        done,
        setDone,
        edit,
        setEdit,
    };
}

const DEFAULT_TODO_LIST = [
    createItem("react-without-react", true),
    createItem("solidjs", false),
    createItem("vue + Mobx", false),
];

enum Filters {
    All = "All",
    Active = "Active",
    Completed = "Completed",
    Editing = "Editing",
}

type FiltersStrings = keyof typeof Filters;

const FILTER_MAP: { [k in FiltersStrings]: (i: TodoItem) => boolean } = {
    All: () => true,
    Active: (task) => !task.done(),
    Completed: (task) => task.done(),
    Editing: (task) => task.edit(),
};

export function Todo() {
    const [selectedFilter, setSelectedFilter] = createSignal<Filters>(
        Filters.All
    );
    const [value, setValue] = createSignal("");
    const [list, setList] = createSignal(DEFAULT_TODO_LIST);

    const filteredList = () => list().filter(FILTER_MAP[selectedFilter()]);

    return () => (
        <div class="todoapp stack-large">
            <Form value={value} setValue={setValue} setList={setList} />

            <FilterBar
                selectedFilter={selectedFilter}
                setSelectedFilter={setSelectedFilter}
            />

            {() => (
                <h3>
                    {selectedFilter()} Task
                    {filteredList().length !== 1 ? "s" : ""}
                </h3>
            )}

            <ul class="todo-list stack-large stack-exception">
                <For each={filteredList}>
                    {(item: TodoItem) => (
                        <TodoListItem item={item} setList={setList} />
                    )}
                </For>
            </ul>

            {() => (
                <p class="task-completed">
                    {list().filter((t) => !t.done()).length} task
                    {list().filter((t) => !t.done()).length !== 1
                        ? "s"
                        : ""}{" "}
                    remaining.
                </p>
            )}
        </div>
    );
}

interface TodoListItemProps {
    item: TodoItem;
    setList: (v: (s?: TodoItem[]) => TodoItem[]) => void;
}

function TodoListItem({ item, setList }: TodoListItemProps) {
    return () => (
        <li class="todo stack-small">
            <div class="c-cb">
                {() => (
                    <input
                        type="checkbox"
                        onchange={(e) => item.setDone(e.currentTarget.checked)}
                        {...(item.done() && {
                            checked: true,
                        })}
                    />
                )}
                {() =>
                    item.edit() ? (
                        <input
                            class="todo-label"
                            id={"input-" + item.key}
                            value={item.label}
                            oninput={(e) => {
                                item.label = e.currentTarget.value;
                            }}
                        />
                    ) : (
                        <label
                            class="todo-label"
                            style={
                                item.done()
                                    ? "text-decoration: line-through;"
                                    : ""
                            }
                        >
                            {item.label}
                        </label>
                    )
                }
            </div>
            <div class="btn-group">
                <button
                    class="btn"
                    onclick={() => {
                        item.setEdit(!item.edit());
                    }}
                >
                    {() => (item.edit() ? "Update" : "Edit")}
                </button>
                <button
                    class="btn btn__danger"
                    onclick={() => {
                        setList((l?: TodoItem[]) =>
                            l!.filter((it) => it.key !== item.key)
                        );
                    }}
                >
                    Delete
                </button>
            </div>
        </li>
    );
}

interface FormProps {
    value: () => string;
    setValue: (v: string) => void;
    setList: (v: (s?: TodoItem[]) => TodoItem[]) => void;
}

function Form({ value, setValue, setList }: FormProps) {
    return () => (
        <form>
            <h2 class="label-wrapper">
                <label class="label__lg">What needs to be done?</label>
            </h2>
            <div class="form-input">
                <input
                    type="text"
                    id="new-todo-input"
                    name="text"
                    class="input input__lg"
                    value={value}
                    oninput={(e) => setValue(e.currentTarget.value)}
                />
                <button
                    type="submit"
                    class="btn btn__primary btn__lg"
                    onclick={(e) => {
                        e.preventDefault();
                        setList((l) => [...l!, createItem(value())]);
                        setValue("");
                    }}
                >
                    Add
                </button>
            </div>
        </form>
    );
}

interface FilterButtonProps {
    label: Filters;
    pressed: () => Filters;
    onpress: (v: Filters) => void;
}

function FilterButton({ label, pressed, onpress }: FilterButtonProps) {
    return () => (
        <button
            type="button"
            class="btn toggle-btn"
            onclick={() => {
                onpress(label);
            }}
            aria-pressed={pressed() === label}
        >
            <span class="visually-hidden">Show </span>
            <span>{label}</span>
            <span class="visually-hidden"> tasks</span>
        </button>
    );
}

interface FilterBarProps {
    selectedFilter: () => Filters;
    setSelectedFilter: (v?: Filters) => void;
}

function FilterBar({ selectedFilter, setSelectedFilter }: FilterBarProps) {
    return () => (
        <div class="filters btn-group stack-exception">
            {Object.values(Filters).map((f) => (
                <FilterButton
                    label={f}
                    pressed={selectedFilter}
                    onpress={setSelectedFilter}
                />
            ))}
        </div>
    );
}
