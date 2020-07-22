import React from "react";
import { Classes, Dialog, Button, RadioGroup, Radio, FormGroup, Label } from "@blueprintjs/core";
import { GLTF2Export } from "babylonjs-serializers";
import { SceneSerializer } from "babylonjs";
import { Editor } from "babylonjs-editor";
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { CloudFront } from 'aws-sdk';
import { Buffer } from "buffer";
import { exportPreferences, importPreferences } from './preferences';

export interface IPublishDialogProps {
  handleInvisible: Function;
  handleVisible: Function;
  isOpen: boolean;
  editor: Editor;
}

export interface IPublishDialogState {
  isOpen: boolean;
  format: string;
  filepath: string;
  distroId: string;
  bucket: string;
}

const DEFAULT_FORMAT = 'glb';

export class PublishDialog extends React.Component<
  IPublishDialogProps,
  IPublishDialogState
  > {
    //TODO: reference the workspace preferences first
  public state: IPublishDialogState = {
    isOpen: this.props.isOpen,
    format: 'glb',
    filepath: 'scenes/my_scene/babylon' + '.' + DEFAULT_FORMAT, 
    distroId: '',
    bucket: '',
  };

  public constructor(props) {
    super(props);

    //grab the local preferences and set them in the local state (so they can be referenced as the default values in the render() function)
    const prefs = exportPreferences();

    this.state.filepath = prefs.filepath;
    this.state.distroId = prefs.distroId;
    this.state.bucket = prefs.bucket;
    this.state.format = prefs.format;
  }

  public render(): React.ReactNode {
 
    return (<Dialog
      isOpen={this.state.isOpen}
      autoFocus={true}
      usePortal={false}
      canOutsideClickClose={false}
      enforceFocus={true}
      transitionDuration={1000}
    >
      <div className={Classes.DIALOG_BODY} key={"hello-world"}>
      <FormGroup>
        <RadioGroup
          label="Publish Format"
          selectedValue={this.state.format}
          onChange={(event: React.FormEvent<HTMLInputElement>)  => { 
            this.setState({
              format: event.currentTarget.value
            })
           }}
        >
          <Radio label=".gLTF" value="gltf" />
          <Radio label=".gLB" value="glb" />
          <Radio label=".babylon" value="babylon" />
        </RadioGroup>  
        <Label>
          File Path
          <input onChange={(evt) => {this.setState({filepath: evt.target.value})}} value={this.state.filepath} placeholder={'scenes/my_scene/babylon' + DEFAULT_FORMAT} className={Classes.INPUT} id="publish-path" name="publish-path" />
        </Label>
        <Label>
           Bucket Name
          <input onChange={(evt) => {this.setState({bucket: evt.target.value})}} value={this.state.bucket} placeholder={'my-bucket-name'} className={Classes.INPUT} id="publish-bucket" name="publish-bucket" />
        </Label>
        <Label>
           Distribution ID
          <input onChange={(evt) => {this.setState({distroId: evt.target.value})}} value={this.state.distroId} placeholder={'ASDF'} className={Classes.INPUT} id="publish-distro-id" name="publish-distro-id" />
        </Label>
        </FormGroup>
      </div>
      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <Button onClick={() => this.props.handleInvisible()}>Close</Button>
          <Button onClick={() => this._handlePublishScene()}>Publish</Button>
        </div>
      </div>
    </Dialog>);
  }


  private async _handleCacheInvalidation(): Promise<void> {
    if(!this.state.filepath) {
      throw new Error('Invalid filepath');
    }

    if(!this.state.distroId || this.state.distroId === '') {
      throw new Error('Invalid Distribution ID')
    }

    //CloudFront requires a leading slash, however S3 will create an "empty folder" (leading slash) if uploaded with it;
    //so we choose the convention of not adding a leading slash in the filepath, and prepending it for the CloudFront command.
    const filepath = this.state.filepath.charAt(0) === '/' ? this.state.filepath : `/${this.state.filepath}`;

    //TODO: handle gltf and .babylon formats, which output multiple files
    const Items = [ filepath ];

    const params = {
      DistributionId: this.state.distroId,
      InvalidationBatch: {
        CallerReference: (new Date(Date.now())).toUTCString(), 
        Paths: { 
          Quantity: Items.length, 
          Items,
        }
      }
    };

    const client = new CloudFront({region: 'us-east-1'});

    await client.createInvalidation(params).promise();
  }
  
  private async _handlePublishScene(): Promise<void> {
    let exportedScene : any;
    const client : S3Client = new S3Client({region: 'us-east-1'});
    try {

      if(!this.props.editor.scene) {
        throw new Error('No active scene to publish');
        return;
      }

      switch (this.state.format) {
        case 'glb': 
          exportedScene = await GLTF2Export.GLBAsync(this.props.editor.scene, name, {}); 
          let glbBlob = exportedScene.glTFFiles[".glb"];
          //cast the Blob to an ArrayBuffer
          const buffer : ArrayBuffer = await glbBlob.arrayBuffer();
          //cast the ArrayBuffer to a Buffer, because this is a necessary step for some reason
          const stringified : Buffer = Buffer.from(buffer);
          //create and send the command; 
          const command = new PutObjectCommand({
            Body: stringified,
            Bucket: this.state.bucket,
            Key: this.state.filepath,
          });

          await client.send(command);
          break;
          //TODO: research upload for gltf (multiple files, JSON-like w/ texture files) and how it works when importing
        case 'gltf': 
          exportedScene = await GLTF2Export.GLTFAsync(this.props.editor.scene, name, {}); 
          break;
          //TODO: research upload for Babylon native format (multiple files, JSON-like w/ texture files) and how it works when importing
        case 'babylon': 
          exportedScene = await SceneSerializer.Serialize(this.props.editor.scene);
        default: 
          throw new Error('Trying to publish to unsupported format');
      }

      //invalidate the object(s) if necessary
      if(this.state.distroId && this.state.distroId !== '') {
        await this._handleCacheInvalidation();
      }

      importPreferences({
        ...this.state
      })

    } catch (e) {
      throw new Error('Error publishing scene: ' + e);
    }
  }
}
