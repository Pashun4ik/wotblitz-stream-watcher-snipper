{
    // vk.com/ecmascript6
    const getTournaments = fetch('https://wotblitz.ru/ru/api/tournaments/')
        .then(x => x.json())
        .then(x => x.results)

    const getFutureTournaments = getTournaments
        .then(ts => ts.filter(t => t.streams.length && (t.phase !== 'finished' && t.phase !== 'complete')))

    const getStreams = getFutureTournaments
        .then(ts => ts
            .map(t => t.streams)
            .flat(1))

    const getActiveStream = getStreams.then(streams => streams.find(s => s.is_live && s.rewards.length))

    function main () {
        return getActiveStream
            .then(stream => stream ? stream : Promise.reject())
            .then(stream => {
                console.log({stream})
                const ws = new WebSocket(`wss://wotblitz.ru/tournament-season/watch/${stream.id}/`)
                ws.onmessage = e => console.log(e.data)

                let tm

                ws.onopen = () => {
                    ws.send('{"command":"watching"}')
                    tm = setInterval(() => ws.send('{"command":"watching"}'), 5000)
                }

                ws.onclose = () => {
                    clearInterval(tm)
                    setTimeout(main, 10000)
                }
            })
            .catch(() => {
                console.log('В настоящий момент нет прямых трансляций с наградой')
                setTimeout(main, 60000)
            })
    }

    main()
}