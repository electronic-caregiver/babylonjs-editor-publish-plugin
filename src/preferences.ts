export interface PublishPreferences {
    /**
     * the object path for S3 (currently only supported provider is AWS), and optionally the CloudFront invalidated filepath
     */
    filepath: string;
    /**
     * empty string if not selected;
     * the CloudFront Distribution ID that should be invalidated 
     */
    distroId: string;
    /**
     * the chosen format to export and publish
     */
    format: 'gltf' | 'glb' | 'babylon';

    /**
     * the S3 bucket name (currently only supported provider is AWS)
     */
    bucket: string;
}

/**
 * The saved preferences (with default values) for the plugin
 */
export const preferences : PublishPreferences = {
    filepath: 'scenes/default/scene.glb',
    distroId: '',
    format: 'glb',
    bucket: 'my-bucket-name'
};

export const exportPreferences = () => ({
    filepath: preferences.filepath,
    distroId: preferences.distroId,
    format: preferences.format,
    bucket: preferences.bucket,
});

/**
 * Imports the preferences of the plugin from its JSON representation.
 */
export const importPreferences = (config: any) => {
    preferences.filepath = config.filepath;
    preferences.distroId = config.distroId;
    preferences.format = config.format;
    preferences.bucket = config.bucket;
};

export class PublishPreferences { }