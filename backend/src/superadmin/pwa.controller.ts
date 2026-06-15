import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Controller('pwa')
export class PwaController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('manifest.json')
  async getManifest(@Res() res: Response) {
    const settings = await this.prisma.appSetting.findMany({
      where: {
        key: {
          in: [
            'pwa_app_name',
            'app_name',
            'pwa_app_short_name',
            'app_short_name',
            'pwa_app_description',
            'app_description',
            'pwa_app_theme_color',
            'app_accent_color',
            'pwa_app_background_color',
          ],
        },
      },
    });

    const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

    const name =
      settingsMap.get('pwa_app_name') ||
      settingsMap.get('app_name') ||
      'ProjectFlow';
    const shortName =
      settingsMap.get('pwa_app_short_name') ||
      settingsMap.get('app_short_name') ||
      'ProjectFlow';
    const description =
      settingsMap.get('pwa_app_description') ||
      settingsMap.get('app_description') ||
      'Collaborative SaaS Project Management';
    const themeColor =
      settingsMap.get('pwa_app_theme_color') ||
      settingsMap.get('app_accent_color') ||
      '#f59e0b';
    const backgroundColor =
      settingsMap.get('pwa_app_background_color') || '#0f172a';

    const manifest = {
      name,
      short_name: shortName,
      description,
      theme_color: themeColor,
      background_color: backgroundColor,
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: '/pwa/icon.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable',
        },
        {
          src: '/pwa/icon.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
    };

    res.setHeader('Content-Type', 'application/manifest+json');
    return res.json(manifest);
  }

  @Get('icon.png')
  getIcon(@Res() res: Response) {
    const uploadPath = path.join(process.cwd(), 'uploads', 'pwa-icon.png');
    if (fs.existsSync(uploadPath)) {
      res.setHeader('Content-Type', 'image/png');
      return fs.createReadStream(uploadPath).pipe(res);
    }

    // Default icon from public folder
    const defaultPath = path.join(
      process.cwd(),
      '..',
      'frontend',
      'public',
      'project-flow.png',
    );
    if (fs.existsSync(defaultPath)) {
      res.setHeader('Content-Type', 'image/png');
      return fs.createReadStream(defaultPath).pipe(res);
    }

    res.status(404).send('Icon not found');
  }
}
