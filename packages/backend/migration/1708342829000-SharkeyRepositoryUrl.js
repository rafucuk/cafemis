/*
 * SPDX-FileCopyrightText: dakkar and other Cafemis contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class SharkeyRepositoryUrl1708342829000 {
  name = 'SharkeyRepositoryUrl1708342829000'

  async up(queryRunner) {
    await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "repositoryUrl" SET DEFAULT 'https://github.com/rafucuk/cafemis/'`);
    await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "feedbackUrl" SET DEFAULT 'https://github.com/rafucuk/cafemis/-/issues/new'`);
    await queryRunner.query(`UPDATE "meta" SET "repositoryUrl"=DEFAULT WHERE "repositoryUrl" IN ('https://git.cafemis.com/Cafemis/Cafemis','https://github.com/rafucuk/cafemis','https://github.com/misskey-dev/misskey')`);
    await queryRunner.query(`UPDATE "meta" SET "feedbackUrl"=DEFAULT WHERE "feedbackUrl" IN ('https://git.cafemis.com/Cafemis/Cafemis/issues/new/choose','https://github.com/rafucuk/cafemis/issues/new','https://github.com/misskey-dev/misskey/issues/new')`);
  }

  async down(queryRunner) {
    await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "repositoryUrl" SET DEFAULT 'https://git.cafemis.com/Cafemis/Cafemis'`);
    await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "feedbackUrl" SET DEFAULT 'https://git.cafemis.com/Cafemis/Cafemis/issues/new/choose'`);
    await queryRunner.query(`UPDATE "meta" SET "repositoryUrl"=DEFAULT WHERE "repositoryUrl" IN ('https://git.cafemis.com/Cafemis/Cafemis','https://github.com/rafucuk/cafemis','https://github.com/misskey-dev/misskey')`);
    await queryRunner.query(`UPDATE "meta" SET "feedbackUrl"=DEFAULT WHERE "feedbackUrl" IN ('https://git.cafemis.com/Cafemis/Cafemis/issues/new/choose','https://github.com/rafucuk/cafemis/issues/new','https://github.com/misskey-dev/misskey/issues/new')`);
  }
}
