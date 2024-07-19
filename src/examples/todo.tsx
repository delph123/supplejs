import { h, createSignal, For } from "../core";
import useCSS from "./useCss";

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
    createItem("SuppleJS", true),
    createItem("SolidJS", false),
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
    const [selectedFilter, setSelectedFilter] = createSignal<Filters>(Filters.All);
    const [value, setValue] = createSignal("");
    const [list, setList] = createSignal(DEFAULT_TODO_LIST);

    useCSS("todo.css");

    const filteredList = () => list().filter(FILTER_MAP[selectedFilter()]);

    return (
        <div className="todoapp stack-large">
            <Form value={value} setValue={setValue} setList={setList} />

            <FilterBar selectedFilter={selectedFilter} setSelectedFilter={setSelectedFilter} />

            {() => (
                <h3>
                    {selectedFilter()} Task
                    {filteredList().length !== 1 ? "s" : ""}
                </h3>
            )}

            <ul className="todo-list stack-large stack-exception">
                <For each={filteredList}>
                    {(item: TodoItem) => <TodoListItem item={item} setList={setList} />}
                </For>
            </ul>

            {() => (
                <p className="task-completed">
                    {list().filter((t) => !t.done()).length} task
                    {list().filter((t) => !t.done()).length !== 1 ? "s" : ""} remaining.
                </p>
            )}
        </div>
    );
}

interface TodoListItemProps {
    item: TodoItem;
    setList: (v: (s?: TodoItem[]) => TodoItem[]) => void;
}

function TodoListItem({ item, setList }: Readonly<TodoListItemProps>) {
    return (
        <li className="todo stack-small">
            <div className="c-cb">
                {() => (
                    <input
                        type="checkbox"
                        onChange={(e) => item.setDone(e.currentTarget.checked)}
                        {...(item.done() && {
                            checked: true,
                        })}
                    />
                )}
                {() =>
                    item.edit() ? (
                        <input
                            className="todo-label"
                            id={"input-" + item.key}
                            value={item.label}
                            onInput={(e) => {
                                item.label = e.currentTarget.value;
                            }}
                        />
                    ) : (
                        <label
                            className="todo-label"
                            style={item.done() ? "text-decoration: line-through;" : ""}
                        >
                            {item.label}
                        </label>
                    )
                }
            </div>
            <div className="btn-group">
                <button
                    className="btn"
                    onClick={() => {
                        item.setEdit(!item.edit());
                    }}
                >
                    {() => (item.edit() ? "Update" : "Edit")}
                </button>
                <button
                    className="btn btn__danger"
                    onClick={() => {
                        setList((l?: TodoItem[]) => l!.filter((it) => it.key !== item.key));
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

function Form({ value, setValue, setList }: Readonly<FormProps>) {
    return (
        <form>
            <h2 className="label-wrapper">
                <label className="label__lg">What needs to be done?</label>
            </h2>
            <div className="form-input">
                <input
                    type="text"
                    id="new-todo-input"
                    name="text"
                    className="input input__lg"
                    value={value}
                    onInput={(e) => setValue(e.currentTarget.value)}
                />
                <button
                    type="submit"
                    className="btn btn__primary btn__lg"
                    onClick={(e) => {
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
    onPress: (v: Filters) => void;
}

function FilterButton({ label, pressed, onPress }: Readonly<FilterButtonProps>) {
    return (
        <button
            type="button"
            className="btn toggle-btn"
            onClick={() => {
                onPress(label);
            }}
            aria-pressed={() => pressed() === label}
        >
            <span className="visually-hidden">Show </span>
            <span>{label}</span>
            <span className="visually-hidden"> tasks</span>
        </button>
    );
}

interface FilterBarProps {
    selectedFilter: () => Filters;
    setSelectedFilter: (v: Filters) => void;
}

function FilterBar({ selectedFilter, setSelectedFilter }: Readonly<FilterBarProps>) {
    return (
        <div className="filters btn-group stack-exception">
            {Object.values(Filters).map((f) => (
                <FilterButton label={f} pressed={selectedFilter} onPress={setSelectedFilter} />
            ))}
        </div>
    );
}
