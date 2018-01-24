const canvas = document.getElementById('stage')
, stage = canvas.getContext('2d')
, stageW = 640
, stageH = 400
, tileW = 16
, tileH = 16
, levelW = Math.floor(stageW / tileW)
, levelH = Math.floor(stageH / tileH)
, tiles = {
    WALL: 0,
    FLOOR: 1
}
, buttons = {
    Up: 0,
    Down: 0,
    Left: 0,
    Right: 0,
    Fire: 0
}

canvas.width = stageW
canvas.height = stageH

document.addEventListener('keydown', ev => {
    if (ev.key === 'a') {
        if (!buttons.Left) px -= 1
    } else if (ev.key === 'd') {
        if (!buttons.Right) px += 1
    } else if (ev.key === 's') {
        if (!buttons.Down) py += 1
    } else if (ev.key === 'w') {
        if (!buttons.Up) py -= 1
    } else if (ev.key === ' ') {
        if (!buttons.Fire) buttons.Fire = 1
    }
})

document.addEventListener('keyup', ev => {
    if (ev.key === 'a') {
        if (buttons.Left) buttons.Left = 0
    } else if (ev.key === 'd') {
        if (buttons.Right) buttons.Right = 0
    } else if (ev.key === 's') {
        if (buttons.Down) buttons.Down = 0
    } else if (ev.key === 'w') {
        if (buttons.Up) buttons.Up = 0
    } else if (ev.key === ' ') {
        if (buttons.Fire) buttons.Fire = 0
    }
})

const range = (min, max) => {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min)) + min
}

const nearest = (min, v, max) =>
      v < (max - min) / 2 ? min : max

const btn = name => name in buttons && buttons[name]

const TileMap = (w, h, def=tiles.FLOOR) => ({
    w, h,
    tiles: Array.from({length: w * h}, () => def)
})

const getMap = (tilemap, x, y) => tilemap.tiles[y * tilemap.w + x]
const setMap = (tilemap, x, y, v) => {
    tilemap.tiles[y * tilemap.w + x] = v
}
const dig = (tilemap, x1, y1, x2, y2, tile=tiles.FLOOR) => {
    for (let y = y1; y < y2; y++) {
        for (let x = x1; x < x2; x++) {
            setMap(tilemap, x, y, tile)
        }
    }
}
const digTo = (tilemap, x1, y1, x2, y2, tile=tiles.FLOOR) => {
    const dx = x1 === x2 ? 0 : x1 < x2 ? 1 : -1
    , dy = y1 === y2 ? 0 : y1 < y2 ? 1 : -1
    let x = x1, y = y1
    while (x != x2) {
        x += dx
        setMap(level, x, y, tile)
    }
    while (y != y2) {
        y += dy
        setMap(level, x, y, tile)
    }
}

const genRoom = () => {
    const w = range(4, 15)
    , h = range(4, 15)
    return {
        x: range(1, levelW - w),
        y: range(1, levelH - h),
        w, h,
        placed: false,
        connected: false
    }
}
const genRooms = numRooms =>
      Array.from({length: numRooms},
                 () => genRoom())

const genLevelRooms = level => {

    const hasTileInArea = (tilemap, x, y, w, h, tile) => {
        for (let j = y; j < y + w; j++) {
            for (let i = x; i < x + w; i++) {
                if (getMap(level, i, j) === tile) {
                    return [i, j];
                }
            }
        }
        return false;
    }
    , notAllPlaced = rooms => rooms.filter(r => !r.placed)
    , rooms = genRooms(range(3, 5))
    let unplaced = Array.from(rooms)

    while (unplaced.length > 0) {
        const r = unplaced[0]
        , t = hasTileInArea(level, r.x, r.y, r.w, r.h, tiles.FLOOR)

        if (t) {
            const [tx, ty] = t
            r.x = tx + 2
            r.y = ty + 2
        } else {
            dig(level, r.x, r.y, r.x + r.w, r.y + r.h)
            r.placed = true
        }
        unplaced = notAllPlaced(unplaced)
    }
    let n = 10
    while (n > 0) {
        for (let i = 0; i < rooms.length; i++) {
            const r = rooms[i]
            for (let j = 0; j < rooms.length; j++) {
                if (j === i) continue;
                const o = rooms[j]
                digTo(level,
                      Math.floor((r.x + r.w) / 2),
                      Math.floor((r.y + r.h) / 2),
                      Math.floor((o.x + o.w) / 2),
                      Math.floor((o.y + o.h) / 2)
                     )
            }
        }
        digTo(level,
              range(1, level.w - 1),
              range(1, level.h - 1),
              range(1, level.w - 1),
              range(1, level.h - 1))
        n--
    }

    for (let i = 0; i < level.w; i++) {
        setMap(level, i, 0, tiles.WALL)
        setMap(level, i, level.h - 1, tiles.WALL)
    }
    for (let i = 0; i < level.h; i++) {
        setMap(level, 0, i, tiles.WALL)
        setMap(level, level.w - 1, i, tiles.WALL)
    }
}

let level = TileMap(levelW, levelH, tiles.WALL)
genLevelRooms(level)

const clr = () => {
    stage.fillStyle = 'black'
    stage.fillRect(0, 0, stageW, stageH)
}

let px = 0, py = 0
for (let y = 0; y < level.h; y++) {
    for (let x = 0; x < level.w; x++) {
        if (getMap(level, x, y) === tiles.FLOOR) {
            px = x
            py = y
        }
    }
}

const update = dt => {
    if (btn('Right')) px += 1
    if (btn('Left')) px -= 1
    if (btn('Down')) py += 1
    if (btn('Up')) py -= 1
}

const render = () => {
    clr()
    for (let y = 0; y < level.h; y++) {
        for (let x = 0; x < level.w; x++) {
            if (getMap(level, x, y) == tiles.WALL) {
                stage.fillStyle = 'blue'
                stage.fillRect(x * tileW, y * tileH, tileW, tileH)
            }
        }
    }
    stage.fillStyle = 'white'
    stage.fillRect(px * tileW, py * tileH, tileW, tileH)
}

const loop = dt => {
    update(dt)
    render()
    window.requestAnimationFrame(loop)
}

window.requestAnimationFrame(loop)
