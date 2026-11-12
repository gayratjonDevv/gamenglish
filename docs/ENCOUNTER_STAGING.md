# Z001 — a continuous first encounter

This revision stages the first meeting as a performance, rather than immediately playing the same greeting on each dialogue click. Existing supplied models, retargeted motion clips and the honest subtitle/recorded-audio distinction are retained.

## Data and runtime

`MissionStep.staging` contains learner-paced direction: a minimum duration, a waiting caption, optional automatic continuation and ordered acting cues. Cues describe attention, body turning, motion, emotion, camera and the instant the spoken/subtitled line becomes available. No new component is created per beat or level.

`ActingTimeline` runs only on scene update deltas. It waits for blocking movements to settle, emits each cue once, and emits separate `line-ready` and `staged` events. Reapplying the same step does not replay its gesture. World updates pause with the game. Reduced motion slows the performance clock to stay aligned with the existing motion policy.

`EncounterActing` applies cues to the three actors. `ActorGaze` layers bounded, damped head attention on the retargeted body pose: a head turn can lead a full body turn. The neighbor looks along the street before the meeting. Idle/listening resumes while the learner thinks; presentation gestures are time bounded.

## First exchange

1. Mother and child approach; the neighbor stays at the meeting area.
2. Once everyone settles, the neighbor notices the child; the child's attention follows, then the mother's.
3. The neighbor turns, performs one greeting, and the Hello caption/recording becomes available during the gesture.
4. After the greeting line is established, the mother's short reply follows automatically while the neighbor's hand can finish lowering naturally. She does not repeat the same hand wave.
5. Mother and child turn toward one another before the explanation. The neighbor waits.
6. Repetition and answer tasks stay manual. A later child greeting and the neighbor's response connect automatically after the learner answers.

The first greeting, reply, explanation and guided turn span roughly 15 seconds of authored staging, excluding travel, learner pauses and longer supplied audio. It is not a fixed-duration finished movie. Existing recordings have not been supplied, so final spoken timing and lip sync are still absent.

## UI and camera

The waiting caption appears before the line cue. Recorded audio cannot autoplay before that cue. Continue is held until the performance and current playback finish. Automatic transitions stop for pauses, learner tasks and playback errors; an audio error leaves an explicit manual continuation. Restart rebuilds scene ownership so the opening can replay even when restarting on the first step.

Conversation closeups stay on the same side of the interaction axis. Shot changes cut to the new composition; motion within a shot remains damped. No actor is repositioned merely by changing a dialogue line.

## Evidence and limits

Timeline tests cover blocking, attention → gesture → line order, once-only completion/gestures and manual learning tasks. Supplied-model integration checks the greeting, both travel goals, the first three encounter stages, continuous actor positions and finite normalized head poses.

The browser environment previously reported WebGL disabled. Live visual quality, acting appeal, device performance and film-level realism are not certified by these tests. This is a staged gameplay revision; voice acting, final mother/neighbor models, detailed art direction and visual review remain needed.
