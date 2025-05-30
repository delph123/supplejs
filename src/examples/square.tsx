import { h, createSignal, Accessor } from "../core";
import useCSS from "./useCss";

const Square = (props: { onClick: () => void; value: Accessor<string | null> }) => {
    return (
        <button class="square" onClick={props.onClick}>
            {props.value}
        </button>
    );
};

const Board = (props: { squares: Accessor<(string | null)[]>; onClick: (n: number) => void }) => {
    function renderSquare(i: number) {
        return <Square value={() => props.squares()[i]} onClick={() => props.onClick(i)} />;
    }

    return (
        <div>
            <div class="board-row">
                {renderSquare(0)}
                {renderSquare(1)}
                {renderSquare(2)}
            </div>
            <div class="board-row">
                {renderSquare(3)}
                {renderSquare(4)}
                {renderSquare(5)}
            </div>
            <div class="board-row">
                {renderSquare(6)}
                {renderSquare(7)}
                {renderSquare(8)}
            </div>
        </div>
    );
};

const Game = () => {
    const [state, setState] = createSignal({
        history: [{ squares: Array<string | null>(9).fill(null) }],
        showStep: [] as (string | null)[],
        stepNumber: 0,
        xIsNext: true,
    });

    useCSS("tic-tac-toe.css");

    function handleClick(i: number) {
        const history = state().history.slice(0, state().stepNumber + 1);
        const current = history[history.length - 1];
        const squares = current.squares.slice();
        if (calculateWinner(squares) || squares[i]) {
            return;
        }
        squares[i] = state().xIsNext ? "X" : "O";
        setState({
            history: history.concat([{ squares: squares }]),
            stepNumber: history.length,
            showStep: squares,
            xIsNext: !state().xIsNext,
        });
    }

    const jumpTo = (step: number) => {
        setState((s) => ({
            ...s,
            stepNumber: step,
            xIsNext: step % 2 === 0,
            showStep: s.history[step].squares,
        }));
    };

    const status = () => {
        const history = state().history;
        const current = history[state().stepNumber];
        const winner = calculateWinner(current.squares);

        let status;
        if (winner) {
            status = "Winner: " + winner;
        } else {
            status = "Next player: " + (state().xIsNext ? "X" : "O");
        }
        return status;
    };

    const moves = () =>
        state().history.map((_step, move) => {
            const desc = move ? "Go to move #" + move : "Go to game start";
            return (
                <li>
                    <button class="move" onClick={() => jumpTo(move)}>
                        {desc}
                    </button>
                </li>
            );
        });

    return (
        <div class="game">
            <div class="game-board">
                <Board squares={() => state().showStep} onClick={(i) => handleClick(i)} />
            </div>
            <div class="game-info">
                <div>{status}</div>
                <ol>{moves}</ol>
            </div>
        </div>
    );
};

export { Game };

// Helper Functions
function calculateWinner(squares: (string | null)[]) {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];
    for (const element of lines) {
        const [a, b, c] = element;
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return squares[a];
        }
    }
    return null;
}
