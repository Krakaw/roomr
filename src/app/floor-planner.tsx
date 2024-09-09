'use client'
import React, { useState, useRef, useEffect, MouseEvent, ChangeEvent } from 'react';

interface Room {
    x: number;
    y: number;
    width: number;
    height: number;
    name: string;
    borderColor: string;
    backgroundColor: string;
}

const FloorPlanner: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [startPos, setStartPos] = useState<{ x: number, y: number } | null>(null);
    const [focusedRoom, setFocusedRoom] = useState<number | null>(null);
    const [draggedRoom, setDraggedRoom] = useState<number | null>(null);
    const [dragOffset, setDragOffset] = useState<{ x: number, y: number } | null>(null);
    const [editingRoom, setEditingRoom] = useState<number | null>(null);
    const [newSize, setNewSize] = useState<{ width: number, height: number } | null>(null);
    const cellSize = 20;

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');

        const resizeCanvas = () => {
            if (canvas) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        if (!ctx) return;

        const draw = () => {
            ctx.clearRect(0, 0, canvas?.width || 0, canvas?.height || 0);
            drawGrid(ctx);
            drawRooms(ctx);
            requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
        };
    }, [rooms, focusedRoom, editingRoom, newSize]);

    const drawGrid = (ctx: CanvasRenderingContext2D) => {
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 0.5;

        for (let x = 0; x <= window.innerWidth / cellSize; x++) {
            ctx.beginPath();
            ctx.moveTo(x * cellSize, 0);
            ctx.lineTo(x * cellSize, window.innerHeight);
            ctx.stroke();
        }

        for (let y = 0; y <= window.innerHeight / cellSize; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * cellSize);
            ctx.lineTo(window.innerWidth, y * cellSize);
            ctx.stroke();
        }
    };

    const drawRooms = (ctx: CanvasRenderingContext2D) => {
        rooms.forEach((room, index) => {
            ctx.fillStyle = room.backgroundColor;
            ctx.fillRect(room.x * cellSize, room.y * cellSize, room.width * cellSize, room.height * cellSize);

            ctx.strokeStyle = room.borderColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(room.x * cellSize, room.y * cellSize, room.width * cellSize, room.height * cellSize);

            if (focusedRoom === index) {
                ctx.strokeStyle = 'blue';
                ctx.lineWidth = 4;
                ctx.strokeRect(room.x * cellSize, room.y * cellSize, room.width * cellSize, room.height * cellSize);
                ctx.font = 'bold 12px Arial';
            } else {
                ctx.font = '12px Arial';
            }

            ctx.fillStyle = 'black';
            ctx.fillText(room.name, (room.x + 0.5) * cellSize, (room.y + 0.5) * cellSize);

            if (editingRoom === index) {
                ctx.fillText('', (room.x + 0.5) * cellSize, (room.y + 1) * cellSize);
            } else {
                ctx.fillText(`${room.width}x${room.height}`, (room.x + 0.5) * cellSize, (room.y + 1) * cellSize);
            }
        });
    };

    const getMousePosition = (e: MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };

        const x = Math.floor((e.clientX - rect.left) / cellSize);
        const y = Math.floor((e.clientY - rect.top) / cellSize);
        return { x, y };
    };

    const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
        const { x, y } = getMousePosition(e);
        setStartPos({ x, y });

        // Check if a room is clicked
        const clickedRoomIndex = rooms.findIndex(room =>
            x >= room.x && x < room.x + room.width &&
            y >= room.y && y < room.y + room.height
        );

        if (clickedRoomIndex !== -1) {
            handleSizeClick(clickedRoomIndex);
            setFocusedRoom(clickedRoomIndex);
            setDraggedRoom(clickedRoomIndex);
            setDragOffset({ x: x - rooms[clickedRoomIndex].x, y: y - rooms[clickedRoomIndex].y });
        }
    };

    const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
        if (draggedRoom === null) return;

        const { x, y } = getMousePosition(e);
        const newRooms = [...rooms];
        newRooms[draggedRoom] = {
            ...newRooms[draggedRoom],
            x: x - (dragOffset?.x || 0),
            y: y - (dragOffset?.y || 0)
        };
        setRooms(newRooms);
    };

    const handleMouseUp = (e: MouseEvent<HTMLCanvasElement>) => {
        if (draggedRoom !== null) {
            setDraggedRoom(null);
            setDragOffset(null);
            return;
        }

        if (!startPos) return;

        const { x, y } = getMousePosition(e);

        const newRoom: Room = {
            x: Math.min(startPos.x, x),
            y: Math.min(startPos.y, y),
            width: Math.abs(x - startPos.x) + 1,
            height: Math.abs(y - startPos.y) + 1,
            name: `Room ${rooms.length + 1}`,
            borderColor: getRandomColor(),
            backgroundColor: getRandomColor(0.2)
        };

        setRooms([...rooms, newRoom]);
        setFocusedRoom(rooms.length);
        setStartPos(null);
    };

    const handleSizeClick = (index: number) => {
        setEditingRoom(index);
        setNewSize({ width: rooms[index].width, height: rooms[index].height });
    };

    const handleSizeChange = (e: ChangeEvent<HTMLInputElement>, dimension: 'width' | 'height') => {
        if (newSize) {
            setNewSize({ ...newSize, [dimension]: parseInt(e.target.value) });
        }
    };

    const handleSizeSubmit = (index: number) => {
        if (newSize) {
            const newRooms = [...rooms];
            newRooms[index] = { ...newRooms[index], ...newSize };
            setRooms(newRooms);
            setEditingRoom(null);
            setNewSize(null);
        }
    };

    const getRandomColor = (alpha = 1): string => {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    return (
        <div className="floor-planner">
            <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                style={{ border: '1px solid black' }}
            />
            {editingRoom !== null && (
                <div className={'size-input'} style={{ position: 'absolute', top: `${rooms[editingRoom].y * cellSize}px`, left: `${rooms[editingRoom].x * cellSize}px` }}>
                    <input
                        type="number"
                        value={newSize?.width || ''}
                        onChange={(e) => handleSizeChange(e, 'width')}
                        onBlur={() => handleSizeSubmit(editingRoom)}
                    />
                    <input
                        type="number"
                        value={newSize?.height || ''}
                        onChange={(e) => handleSizeChange(e, 'height')}
                        onBlur={() => handleSizeSubmit(editingRoom)}
                    />
                </div>
            )}
        </div>
    );
};

export default FloorPlanner;