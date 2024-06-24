import { h, createSignal } from "../core";
import useCSS from "./useCss";

const Square = (props) => {
    return () => (
        <button class="square" onClick={props.onClick}>
            {props.value}
        </button>
    );
};

const Board = (props) => {
    function renderSquare(i) {
        return () => <Square value={() => props.squares()[i]} onClick={() => props.onClick(i)} />;
    }

    return () => (
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
        history: [{ squares: Array(9).fill(null) }],
        showStep: [] as any[],
        stepNumber: 0,
        xIsNext: true,
    });

    useCSS("tic-tac-toe.css");

    function handleClick(i) {
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

    const jumpTo = (step) => {
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

    return () => (
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
function calculateWinner(squares) {
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
    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return squares[a];
        }
    }
    return null;
}
