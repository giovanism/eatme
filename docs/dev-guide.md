# Developers Guide

EatMe is deployed as follows:

![][img-deploy]

For the configurations of Nginx and Redis, please see [nginx.conf][conf-nginx] and [redis.conf][conf-redis], respectively.

Logically, we separate the implementations for the [client][doc-client] (i.e., static files in the diagram above) and the [WebSocket servers][doc-server]. Before going through the details, we recommend you go over the following sections to grasp the whole picture first.

- [State Machine](#state-machine)
- [Logical Data Model](#logical-data-model)
- [Sequence Diagrams](#sequence-diagrams)
  - [Schedule Battle](#schedule-battle)
  - [Start Battle](#start-battle)
  - [Stop Battle](#stop-battle)

## State Machine

For each player, we maintain a state machine below:

![][img-state-plyr]

## Logical Data Model

Currently we have only two entities. The Player entity stores the player's id, state (refer to [State Machine](#state-machine)), next action, etc. We also store the information of the server that is currently maintaining the player's WebSocket connection. The Battle entity stores the battle's id, the two involved players' ids and the seed for the random number generator.

![][img-ldm]

The model is constructed by PowerDesigner. You can [download][src-ldm] it to go through the details of each entity.

## Sequence Diagrams

The three diagrams below show how we schedule, start and stop a battle.

### Schedule Battle

![][img-seq-battle-schedule]

### Start Battle

![][img-seq-battle-start]

### Stop Battle

![][img-seq-battle-stop]


[img-deploy]: ./images/eatme_deploy.png
[img-ldm]: ./images/eatme_ldm.png
[img-state-plyr]: ./images/eatme_state_player.png
[img-seq-battle-schedule]: ./images/eatme_seq_battle_schedule.png
[img-seq-battle-start]: ./images/eatme_seq_battle_start.png
[img-seq-battle-stop]: ./images/eatme_seq_battle_stop.png

[conf-nginx]: ../conf/nginx.conf
[conf-redis]: ../conf/redis.conf

[doc-client]: ../client/
[doc-server]: ../server/

[src-ldm]: ./models/eatme_ldm.ldm
