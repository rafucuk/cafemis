export class PageTags1738395630985 {
    name = 'PageTags1738395630985'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "page" DROP COLUMN "tags"`);
        await queryRunner.query(`ALTER TABLE "page" ADD "tags" character varying(128) array NOT NULL DEFAULT '{}'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "page" DROP COLUMN "tags"`);
        await queryRunner.query(`ALTER TABLE "page" ADD "tags" text array`);
    }
};
