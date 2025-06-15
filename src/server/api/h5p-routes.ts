import express from 'express';
import { h5pEditor, h5pPlayer } from '../h5p/h5p-server';
import { H5PAjaxEndpoint, H5PAjaxRouter } from '@lumieducation/h5p-express';

const router = express.Router();

// Set up H5P Ajax endpoints
const h5pAjaxRouter = new H5PAjaxRouter(
  h5pEditor,
  h5pPlayer,
  (req) => req.user?.id || 'anonymous', // Get user ID from session
  (req) => req.user?.language || 'en' // Get user language from session
);

router.use('/ajax', h5pAjaxRouter.router);

// Endpoint to get content for the player
router.get('/content/:contentId', async (req, res) => {
  try {
    const contentId = req.params.contentId;
    const userId = req.user?.id || 'anonymous';
    
    const playerModel = await h5pPlayer.render(contentId, userId);
    res.json(playerModel);
  } catch (error) {
    console.error('Error getting H5P content:', error);
    res.status(500).json({ error: 'Error getting H5P content' });
  }
});

// Endpoint to get content for the editor
router.get('/editor/:contentId', async (req, res) => {
  try {
    const contentId = req.params.contentId === 'new' ? undefined : req.params.contentId;
    const userId = req.user?.id || 'anonymous';
    
    const editorModel = await h5pEditor.render(contentId, userId);
    
    if (contentId) {
      const content = await h5pEditor.getContent(contentId);
      res.json({
        ...editorModel,
        library: content.library,
        metadata: content.metadata,
        params: content.params
      });
    } else {
      res.json(editorModel);
    }
  } catch (error) {
    console.error('Error getting H5P editor content:', error);
    res.status(500).json({ error: 'Error getting H5P editor content' });
  }
});

// Endpoint to save content from the editor
router.post('/editor/:contentId?', async (req, res) => {
  try {
    const contentId = req.params.contentId;
    const userId = req.user?.id || 'anonymous';
    
    const { library, params } = req.body;
    
    const savedContent = await h5pEditor.saveOrUpdateContentReturnMetaData(
      contentId,
      library,
      params,
      userId
    );
    
    res.json(savedContent);
  } catch (error) {
    console.error('Error saving H5P content:', error);
    res.status(500).json({ error: 'Error saving H5P content' });
  }
});

export default router;
