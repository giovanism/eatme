# EatMe [![][ci-linux-badge]][ci-linux-state]

EatMe is a two-player battle game based on the classic game of [Snake][wiki-snake]. The original version of this game, [TastySnake][src-tastysnake], was powered by Bluetooth and ran on Android devices. It has now been renamed to EatMe and rewritten with web technologies.

## How to Play

EatMe is very similar to the classic game of Snake. When you find your opponent and both of you get ready, the battle field will show up at the middle of your screen:

![][img-help-battle]

Control the movements of your snake with the four **arrow** keys on your keyboard. Also keep in mind that:

* When two snakes collide, the **attacker** wins.
* Lose when hitting the four boundaries or one's own body.

**Bonus:** You can choose to play with a (stupid) robot when finding no opponents.

## Developers Guide

EatMe is deployed as follows:

![][img-deploy]

Click [here][doc-dev-guide] for more details.

## Contribution Guidelines

We'd love for you to help us improve the project. To keep the high quality of codes, please follow the steps below to make a contribution:

* [Create an issue][new-issue] discussing what you are going to accomplish.
* **After** being approved, [fork this project][fork-proj] to make changes in your own branch.
* [Send us a pull request][send-pr] from your fork's branch to our `master` branch.

## License

See the [LICENSE](./LICENSE) file for license rights and limitations.

[ci-linux-badge]: https://travis-ci.org/chuyangliu/eatme.svg?branch=master
[ci-linux-state]: https://travis-ci.org/chuyangliu/eatme

[wiki-snake]: https://en.wikipedia.org/wiki/Snake_(video_game_genre)

[src-tastysnake]: https://github.com/chuyangliu/TastySnake/

[img-help-battle]: ./client/src/assets/images/help_battle_field.png
[img-deploy]: ./docs/images/eatme_deploy.png

[doc-dev-guide]: ./docs/dev-guide.md

[new-issue]: https://github.com/chuyangliu/EatMe/issues/new/
[fork-proj]: https://help.github.com/articles/fork-a-repo/
[send-pr]: https://help.github.com/articles/about-pull-requests/
