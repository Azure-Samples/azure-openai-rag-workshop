#!/usr/bin/env bash
##############################################################################
# Usage: ./create-packages.sh
# Creates packages for skippable sections of the workshop
##############################################################################

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

target_folder=dist

rm -rf "$target_folder"
mkdir -p "$target_folder"

copyFolder() {
  local src="$1"
  local dest="$target_folder/${2:-}"
  find "$src" -type d -not -path '*node_modules*' -not -path '*/.git' -not -path '*.git/*' -not -path '*/dist' -not -path '*dist/*' -exec mkdir -p '{}' "$dest/{}" ';'
  find "$src" -type f -not -path '*node_modules*' -not -path '*.git/*' -not -path '*dist/*' -exec cp -r '{}' "$dest/{}" ';'
}

makeArchive() {
  local src="$1"
  local name="${2:-$src}"
  local archive="$name.tar.gz"
  local cwd="${3:-}"
  echo "Creating $archive..."
  if [[ -n "$cwd" ]]; then
    pushd "$target_folder/$cwd" >/dev/null
    tar -czvf "../$archive" "$src"
    popd
    rm -rf "$target_folder/${cwd:?}"
  else
    pushd "$target_folder/$cwd" >/dev/null
    tar -czvf "$archive" "$src"
    popd
    rm -rf "$target_folder/${src:?}"
  fi
}

##############################################################################
# Complete solution
##############################################################################

echo "Creating solution package..."
copyFolder . solution
rm -rf "$target_folder/solution/docs"
rm -rf "$target_folder/solution/scripts"
rm -rf "$target_folder/solution/.github/workflows/packages.yml"
rm -rf "$target_folder/solution/.github/workflows/template.yml"
rm -rf "$target_folder/solution/TODO"
rm -rf "$target_folder/solution/SUPPORT.md"
rm -rf "$target_folder/solution/CODE_OF_CONDUCT.md"
rm -rf "$target_folder/solution/SECURITY.md"
makeArchive . solution solution

##############################################################################
# Settings API, without database implementation
##############################################################################

echo "Creating settings-api package..."
copyFolder packages/settings-api
perl -i -pe "s/^.*azure\/cosmos.*?\n//" "$target_folder/packages/settings-api/package.json"

echo -e "import fp from 'fastify-plugin'

// the use of fastify-plugin is required to be able
// to export the decorators to the outer scope

export default fp(async function (fastify, opts) {
  fastify.decorate('db', new MockDatabase());
});

class MockDatabase {
  constructor() {
    this.db = {};
  }

  async saveSettings(userId, settings) {
    await this.#delay();
    this.db[userId] = settings;
  }

  async getSettings(userId) {
    await this.#delay();
    return this.db[userId];
  }

  async #delay() {
    return new Promise(resolve => setTimeout(resolve, 10));
  }
}
" > "$target_folder/packages/settings-api/plugins/database.js"

makeArchive packages settings-api

##############################################################################
# Dice API, without database implementation
##############################################################################

echo "Creating dice-api package..."
copyFolder packages/dice-api
perl -i -pe "s/^.*azure\/cosmos.*?\n//" "$target_folder/packages/dice-api/package.json"

echo -e "import { Injectable } from '@nestjs/common';

export interface Roll {
  sides: number;
  result: number;
  timestamp: number;
}

@Injectable()
export class DbService {
  private mockDb: Roll[] = [];

  async addRoll(roll: Roll) {
    await this.delay();
    this.mockDb.push(roll);
    this.mockDb.sort((a, b) => a.timestamp - b.timestamp);
  }

  async getLastRolls(max: number, sides: number) {
    await this.delay();
    return this.mockDb.filter((roll) => roll.sides === sides).slice(-max);
  }

  private async delay() {
    return new Promise((resolve) => setTimeout(resolve, 10));
  }
}
" > "$target_folder/packages/dice-api/src/db.service.ts"

echo -e "import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbService } from './db.service';
import { RollsController } from './rolls.controller';

@Module({
  imports: [LoggerModule.forRoot()],
  controllers: [AppController, RollsController],
  providers: [AppService, DbService],
})
export class AppModule {}
" > "$target_folder/packages/dice-api/src/app.module.ts"

makeArchive packages dice-api

##############################################################################
# Gateway API
##############################################################################

echo "Creating gateway-api package..."
copyFolder packages/gateway-api
makeArchive packages gateway-api

##############################################################################
# Website
##############################################################################

echo "Creating website package..."
copyFolder packages/website
makeArchive packages website

##############################################################################
# docker-compose.yml
##############################################################################

echo "Creating docker-compose package..."
cp docker-compose.yml "$target_folder/docker-compose.yml"
makeArchive docker-compose.yml docker-compose

##############################################################################
# Deployment
##############################################################################

echo "Creating deploy package..."
mkdir -p "$target_folder/deploy/.github/workflows"
mkdir -p "$target_folder/deploy/.azure"
cp .github/workflows/deploy.yml "$target_folder/deploy/.github/workflows/deploy.yml"
cp .azure/build.sh "$target_folder/deploy/.azure/build.sh"
cp .azure/deploy.sh "$target_folder/deploy/.azure/deploy.sh"
makeArchive . deploy deploy
