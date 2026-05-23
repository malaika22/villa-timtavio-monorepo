import { FolioHeader } from './FolioHeader';
import { FolioLineItems } from './FolioLineItems';

export const Folio = () => {
  return (
    <div className="flex flex-col">
      <FolioHeader />
      <FolioLineItems />
    </div>
  );
};
